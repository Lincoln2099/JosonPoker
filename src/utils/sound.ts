/**
 * 程序化音效管理器（Web Audio API）。
 * 完全不依赖音频文件，所有音效现场合成。
 *
 * 用法：
 *   import { sound } from '@/utils/sound';
 *   sound.play('click');
 *   sound.toggleMute();
 */

type SfxName =
  | 'click'
  | 'select'
  | 'deselect'
  | 'confirm'
  | 'back'
  | 'deal'
  | 'flip'
  | 'splash'
  | 'win'
  | 'lose'
  | 'whoosh'
  | 'thud'
  | 'cluck'
  | 'squawk'
  | 'chime'
  | 'modal';

/** 高情绪节点的短促 BGM（一次性，不循环） */
type BgmName =
  | 'anticipation' // 抓鸡屏 ~6s
  | 'decisive' //     决胜轮 splash ~4s
  | 'fanfareWin' //   GameOver 胜利 ~5s
  | 'fanfareLose'; // GameOver 失败 ~5s

const STORAGE_KEY = 'joson-poker-muted';

/** 环境 BGM（循环播放的文件资源） */
const AMBIENT_BASE_GAIN = 0.32;
const AMBIENT_DUCK_GAIN = 0.09;
const AMBIENT_FADE = 0.8;

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private muted: boolean;
  private listeners = new Set<(muted: boolean) => void>();

  // ---- 环境 BGM（基于音频文件循环） ----
  private ambientUrl: string | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private ambientLoading: Promise<AudioBuffer | null> | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientActive = false;
  private ambientDucked = false;

  // ---- 文件型一次性 SFX（按 URL 缓存 decoded buffer） ----
  private sfxBuffers = new Map<string, AudioBuffer>();
  private sfxLoading = new Map<string, Promise<AudioBuffer | null>>();

  /** Page-Visibility 自动暂停标志:tab 隐藏时把 ctx 置为 suspended,可见时恢复 */
  private pageHiddenSuspend = false;
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    this.muted = this.loadMuted();
    this.installVisibilityHook();
  }

  /**
   * 注册 Page Visibility 监听:
   *   - tab/窗口隐藏 → suspend AudioContext(无声 + 节能)
   *   - tab/窗口可见 → 仅在用户没有手动静音时 resume
   * 这能彻底杜绝"网页切到后台还在响"的情况。
   */
  private installVisibilityHook(): void {
    if (typeof document === 'undefined') return;
    if (this.visibilityHandler) return;
    this.visibilityHandler = () => {
      if (!this.ctx) return;
      if (document.hidden) {
        if (this.ctx.state === 'running') {
          this.pageHiddenSuspend = true;
          this.ctx.suspend().catch(() => {
            /* ignore */
          });
        }
      } else {
        if (this.pageHiddenSuspend && !this.muted && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {
            /* ignore */
          });
        }
        this.pageHiddenSuspend = false;
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler, { passive: true });
    window.addEventListener('pagehide', this.visibilityHandler, { passive: true });
  }

  /**
   * 完全释放音频资源:停所有源、断主 gain、关闭 AudioContext。
   * 在 App 启动时调用一次,清掉 HMR/旧 session 残留;
   * 也用于 HMR dispose 钩子。
   */
  destroy(): void {
    this.hardStopBgm();
    this.hardStopAmbient();
    this.ambientActive = false;
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        /* ignore */
      }
      this.masterGain = null;
    }
    if (this.ctx) {
      try {
        if (this.ctx.state !== 'closed') void this.ctx.close();
      } catch {
        /* ignore */
      }
      this.ctx = null;
    }
    if (this.visibilityHandler && typeof document !== 'undefined') {
      try {
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        window.removeEventListener('pagehide', this.visibilityHandler);
      } catch {
        /* ignore */
      }
      this.visibilityHandler = null;
    }
  }

  // ---------- 公共 API ----------

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  setMuted(value: boolean): boolean {
    this.muted = value;
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
    if (value) {
      // 静音 —— 关键:不能 stop() 环境 BGM 的 source,否则 unmute 时只能从 0
      // 重新创建,听起来就是"从头播放"。正确做法:
      //   1) masterGain.gain → 0 + disconnect destination(瞬间物理静音)
      //   2) 短 BGM(playBgm 一次性的)可以 hardStop,反正它本来就是短曲
      //   3) 环境 BGM 的 source 保持活着,只是 ctx.suspend() 把音频时钟整个冻住,
      //      它的内部播放位置就停在那一帧不动
      //   4) ctx.suspend() 让一切处理停摆,既省电又保留状态
      if (this.ctx && this.masterGain) {
        try {
          this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {
          /* ignore */
        }
        try {
          this.masterGain.disconnect();
        } catch {
          /* already disconnected */
        }
      }
      this.hardStopBgm();
      // ⚠️ 不调 hardStopAmbient —— 保留 ambientSource 让它跟随 ctx 一起冻结/恢复
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {
          /* ignore */
        });
      }
    } else {
      // 取消静音 —— ctx.resume() 之后,环境 BGM source 的播放位置会从冻结点
      // 自然继续往下走(感觉像 pause/resume),不再是从头播放。
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {
          /* ignore */
        });
      }
      if (this.masterGain && this.ctx) {
        try {
          this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.masterGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        } catch {
          /* ignore */
        }
        try {
          this.masterGain.connect(this.ctx.destination);
        } catch {
          /* already connected */
        }
      }
      // 兜底:如果之前是 ambientActive 但 source 已经被 hardStopAmbient
      // 显式停掉过(比如组件卸载流程),那就重新拉起——这种情况只有从 0 开始可选
      if (this.ambientActive && this.ambientBuffer && !this.ambientSource) {
        this.playAmbientNow();
      }
    }
    this.listeners.forEach((cb) => cb(value));
    return value;
  }

  /** 立刻断开短 BGM(playBgm)的所有节点,无淡出。 */
  private hardStopBgm(): void {
    if (!this.ctx || !this.bgmGain) return;
    const node = this.bgmGain;
    this.bgmGain = null;
    try {
      node.gain.cancelScheduledValues(this.ctx.currentTime);
      node.gain.setValueAtTime(0, this.ctx.currentTime);
    } catch {
      /* ignore */
    }
    try {
      node.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  /** 立刻断开环境 BGM 的源 + gain,无淡出。保留 ambientActive 意图 flag。 */
  private hardStopAmbient(): void {
    const source = this.ambientSource;
    const gainNode = this.ambientGain;
    this.ambientSource = null;
    this.ambientGain = null;
    if (source) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      try {
        source.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch {
        /* already disconnected */
      }
    }
  }

  subscribe(cb: (muted: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** 触发一个音效。无延迟、可在事件回调里直接调用。 */
  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const out = this.masterGain!;

    switch (name) {
      case 'click':
        this.playClick(ctx, out, t);
        break;
      case 'select':
        this.playSelect(ctx, out, t);
        break;
      case 'deselect':
        this.playDeselect(ctx, out, t);
        break;
      case 'confirm':
        this.playConfirm(ctx, out, t);
        break;
      case 'back':
        this.playBack(ctx, out, t);
        break;
      case 'deal':
        this.playDeal(ctx, out, t);
        break;
      case 'flip':
        this.playFlip(ctx, out, t);
        break;
      case 'splash':
        this.playSplash(ctx, out, t);
        break;
      case 'win':
        this.playWin(ctx, out, t);
        break;
      case 'lose':
        this.playLose(ctx, out, t);
        break;
      case 'whoosh':
        this.playWhoosh(ctx, out, t);
        break;
      case 'thud':
        this.playThud(ctx, out, t);
        break;
      case 'cluck':
        this.playCluck(ctx, out, t);
        break;
      case 'squawk':
        this.playSquawk(ctx, out, t);
        break;
      case 'chime':
        this.playChime(ctx, out, t);
        break;
      case 'modal':
        this.playModal(ctx, out, t);
        break;
    }
  }

  /** 播一段短促 BGM（一次性，自动结束）。会先停掉当前正在播的 BGM。 */
  playBgm(name: BgmName): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.stopBgm();
    const out = this.ensureBgmGain(ctx);
    if (!out) return;
    const t = ctx.currentTime + 0.05;
    // 短 BGM 期间把环境音乐 duck 下去
    this.duckAmbient(true);
    const durations: Record<BgmName, number> = {
      anticipation: 6.5,
      decisive: 4.2,
      fanfareWin: 5.2,
      fanfareLose: 5.2,
    };
    window.setTimeout(() => this.duckAmbient(false), durations[name] * 1000);
    switch (name) {
      case 'anticipation':
        this.bgmAnticipation(ctx, out, t);
        break;
      case 'decisive':
        this.bgmDecisive(ctx, out, t);
        break;
      case 'fanfareWin':
        this.bgmFanfareWin(ctx, out, t);
        break;
      case 'fanfareLose':
        this.bgmFanfareLose(ctx, out, t);
        break;
    }
  }

  /**
   * 播放一个外部音频文件作为一次性 SFX。按 URL 懒加载 + 缓存，
   * 走 masterGain，遵守静音。可传入 volume（0~1，默认 0.7）。
   */
  playFileSfx(url: string, opts: { volume?: number } = {}): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const volume = opts.volume ?? 0.7;
    const cached = this.sfxBuffers.get(url);
    if (cached) {
      this.playSfxBuffer(ctx, cached, volume);
      return;
    }
    void this.ensureSfxBuffer(ctx, url).then((buf) => {
      if (!buf || this.muted) return;
      this.playSfxBuffer(ctx, buf, volume);
    });
  }

  /** 预加载一个文件 SFX（可选，避免首次播放时的解码抖动）。 */
  preloadFileSfx(url: string): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    void this.ensureSfxBuffer(ctx, url);
  }

  private ensureSfxBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
    const cached = this.sfxBuffers.get(url);
    if (cached) return Promise.resolve(cached);
    const existing = this.sfxLoading.get(url);
    if (existing) return existing;
    const p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`SFX fetch failed: ${r.status}`);
        return r.arrayBuffer();
      })
      .then(
        (bytes) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            ctx.decodeAudioData(bytes, resolve, reject);
          }),
      )
      .then((buf) => {
        this.sfxBuffers.set(url, buf);
        this.sfxLoading.delete(url);
        return buf;
      })
      .catch((err) => {
        console.warn('[sound] SFX load failed', url, err);
        this.sfxLoading.delete(url);
        return null;
      });
    this.sfxLoading.set(url, p);
    return p;
  }

  private playSfxBuffer(ctx: AudioContext, buffer: AudioBuffer, volume: number): void {
    if (!this.masterGain) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(this.masterGain);
    src.start();
  }

  /** 立刻淡出停止 BGM（约 120ms 渐隐）。SFX 不受影响。 */
  stopBgm(): void {
    if (!this.ctx || !this.bgmGain) {
      this.duckAmbient(false);
      return;
    }
    const ctx = this.ctx;
    const node = this.bgmGain;
    this.bgmGain = null;
    const t = ctx.currentTime;
    try {
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(0, t + 0.12);
    } catch {
      /* node already destroyed */
    }
    setTimeout(() => {
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    }, 200);
    this.duckAmbient(false);
  }

  // ============================================================
  //  环境 BGM（长循环音频文件）
  // ============================================================

  /**
   * 启动循环环境音乐。首次调用会异步加载并解码 mp3。
   * 必须在用户手势之后调用才能真正出声（浏览器自动播放策略）。
   */
  startAmbient(url: string): void {
    this.ambientUrl = url;
    this.ambientActive = true;
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    void this.ensureAmbientBuffer(ctx).then((buf) => {
      if (!buf || !this.ambientActive || this.muted) return;
      this.playAmbientNow();
    });
  }

  /** 停止循环环境音乐（外部意图停止：清除意图 flag + 淡出 ~400ms）。 */
  stopAmbient(): void {
    this.ambientActive = false;
    this.stopAmbientSource(0.4);
  }

  /**
   * 内部用：只停止当前 ambient 源节点，不清除 `ambientActive` 意图 flag。
   * 给 mute 用，方便 un-mute 时按意图重建源。
   */
  private stopAmbientSource(fadeSec = 0.12): void {
    if (!this.ctx || !this.ambientGain || !this.ambientSource) return;
    const ctx = this.ctx;
    const gainNode = this.ambientGain;
    const source = this.ambientSource;
    this.ambientGain = null;
    this.ambientSource = null;
    const t = ctx.currentTime;
    try {
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(gainNode.gain.value, t);
      gainNode.gain.linearRampToValueAtTime(0, t + fadeSec);
    } catch {
      /* ignore */
    }
    setTimeout(
      () => {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
        try {
          gainNode.disconnect();
        } catch {
          /* already disconnected */
        }
      },
      Math.max(80, fadeSec * 1000 + 40),
    );
  }

  private ensureAmbientBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
    if (this.ambientBuffer) return Promise.resolve(this.ambientBuffer);
    if (this.ambientLoading) return this.ambientLoading;
    const url = this.ambientUrl;
    if (!url) return Promise.resolve(null);
    this.ambientLoading = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`BGM fetch failed: ${r.status}`);
        return r.arrayBuffer();
      })
      .then(
        (bytes) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            ctx.decodeAudioData(bytes, resolve, reject);
          }),
      )
      .then((buf) => {
        this.ambientBuffer = buf;
        return buf;
      })
      .catch((err) => {
        console.warn('[sound] ambient BGM load failed', err);
        this.ambientLoading = null;
        return null;
      });
    return this.ambientLoading;
  }

  private playAmbientNow(): void {
    if (!this.ctx || !this.ambientBuffer || !this.masterGain) return;
    // 已在播则跳过
    if (this.ambientSource) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.ambientBuffer;
    src.loop = true;
    const gain = ctx.createGain();
    const target = this.ambientDucked ? AMBIENT_DUCK_GAIN : AMBIENT_BASE_GAIN;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + AMBIENT_FADE);
    src.connect(gain).connect(this.masterGain);
    src.start();
    this.ambientSource = src;
    this.ambientGain = gain;
  }

  private duckAmbient(duck: boolean): void {
    this.ambientDucked = duck;
    if (!this.ctx || !this.ambientGain) return;
    const ctx = this.ctx;
    const target = duck ? AMBIENT_DUCK_GAIN : AMBIENT_BASE_GAIN;
    const g = this.ambientGain.gain;
    const t = ctx.currentTime;
    try {
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(target, t + (duck ? 0.25 : 0.6));
    } catch {
      /* ignore */
    }
  }

  // ---------- 内部 ----------

  private ensureBgmGain(ctx: AudioContext): GainNode | null {
    if (!this.masterGain) return null;
    if (this.bgmGain) return this.bgmGain;
    const g = ctx.createGain();
    g.gain.value = 1;
    g.connect(this.masterGain);
    this.bgmGain = g;
    return g;
  }

  private loadMuted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    // 静音态下不要尝试 resume —— 静音时我们显式 suspend 了 ctx，
    // 避免静音期间被其它路径（预加载/订阅回调等）悄悄唤醒。
    if (this.ctx.state === 'suspended' && !this.muted) {
      this.ctx.resume().catch(() => {
        /* user gesture not yet */
      });
    }
    return this.ctx;
  }

  // ---- 工具：单音 ----
  private blip(
    ctx: AudioContext,
    out: GainNode,
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    startTime: number,
    sweepTo?: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), startTime + duration);
    }
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.exponentialRampToValueAtTime(gain, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g).connect(out);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // ---- 工具：白噪声 buffer ----
  private noiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sr * duration), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private playNoise(
    ctx: AudioContext,
    out: GainNode,
    duration: number,
    gain: number,
    filterFreq: number,
    startTime: number,
    filterType: BiquadFilterType = 'lowpass',
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, duration);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.exponentialRampToValueAtTime(gain, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    src.connect(filter).connect(g).connect(out);
    src.start(startTime);
    src.stop(startTime + duration + 0.02);
  }

  // ---------- 各音效合成 ----------

  private playClick(ctx: AudioContext, out: GainNode, t: number) {
    this.blip(ctx, out, 1100, 0.05, 'square', 0.18, t, 700);
  }

  private playSelect(ctx: AudioContext, out: GainNode, t: number) {
    this.blip(ctx, out, 700, 0.07, 'sine', 0.22, t, 1000);
    this.blip(ctx, out, 1200, 0.06, 'triangle', 0.12, t + 0.04);
  }

  private playDeselect(ctx: AudioContext, out: GainNode, t: number) {
    this.blip(ctx, out, 900, 0.08, 'sine', 0.18, t, 500);
  }

  private playConfirm(ctx: AudioContext, out: GainNode, t: number) {
    // 金色: C5 + E5 双音 + 高频泛音
    this.blip(ctx, out, 523, 0.18, 'sine', 0.25, t);
    this.blip(ctx, out, 659, 0.18, 'sine', 0.22, t + 0.04);
    this.blip(ctx, out, 1568, 0.16, 'triangle', 0.1, t + 0.02);
  }

  private playBack(ctx: AudioContext, out: GainNode, t: number) {
    this.blip(ctx, out, 600, 0.12, 'sine', 0.18, t, 280);
  }

  private playDeal(ctx: AudioContext, out: GainNode, t: number) {
    // 纸张翻动：高频噪声 burst
    this.playNoise(ctx, out, 0.06, 0.35, 4500, t, 'highpass');
  }

  private playFlip(ctx: AudioContext, out: GainNode, t: number) {
    // 翻牌：noise sweep + 收尾点击
    this.playNoise(ctx, out, 0.18, 0.22, 2500, t, 'bandpass');
    this.blip(ctx, out, 900, 0.05, 'square', 0.18, t + 0.18);
  }

  private playSplash(ctx: AudioContext, out: GainNode, t: number) {
    // 大鼓 + 高频泛音
    this.blip(ctx, out, 110, 0.45, 'sine', 0.5, t, 60);
    this.blip(ctx, out, 220, 0.4, 'triangle', 0.25, t + 0.02);
    this.blip(ctx, out, 880, 0.35, 'sine', 0.18, t + 0.08);
    this.blip(ctx, out, 1320, 0.3, 'triangle', 0.12, t + 0.12);
  }

  private playWin(ctx: AudioContext, out: GainNode, t: number) {
    // C-E-G-C 上行
    [
      { f: 523, dt: 0 },
      { f: 659, dt: 0.08 },
      { f: 784, dt: 0.16 },
      { f: 1047, dt: 0.24 },
    ].forEach(({ f, dt }) => this.blip(ctx, out, f, 0.3, 'triangle', 0.25, t + dt));
  }

  private playLose(ctx: AudioContext, out: GainNode, t: number) {
    // 下降小调
    [
      { f: 440, dt: 0 },
      { f: 392, dt: 0.12 },
      { f: 349, dt: 0.24 },
    ].forEach(({ f, dt }) => this.blip(ctx, out, f, 0.32, 'sawtooth', 0.18, t + dt));
  }

  private playWhoosh(ctx: AudioContext, out: GainNode, t: number) {
    // 长 noise + 频率扫
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.45);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.45);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    src.connect(filter).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.5);
  }

  private playThud(ctx: AudioContext, out: GainNode, t: number) {
    // 重物撞击：低频 sine 急降 + 噪声脉冲
    this.blip(ctx, out, 180, 0.25, 'sine', 0.55, t, 50);
    this.playNoise(ctx, out, 0.12, 0.4, 800, t, 'lowpass');
  }

  /**
   * "鸡声" 合成引擎 —— 用 sawtooth 做声带源，三组共振峰 band-pass 模拟鸡喉咙，
   * 加低速 LFO 做颤音 + 宽频噪声做呼吸声。可复用给 cluck / squawk / cluck-short。
   */
  private chickenVoice(
    ctx: AudioContext,
    out: GainNode,
    startTime: number,
    duration: number,
    freqStart: number,
    freqEnd: number,
    gain: number,
    opts: { vibrato?: number; vibratoRate?: number; breath?: number } = {},
  ) {
    const { vibrato = 15, vibratoRate = 10 + Math.random() * 8, breath = 0.08 } = opts;

    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(freqStart, startTime);
    saw.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + duration);

    // 颤音 LFO（模拟鸡喉咙的抖动）
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = vibratoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = vibrato;
    lfo.connect(lfoGain).connect(saw.frequency);

    // 三组共振峰 band-pass（对应鸡发声的 F1/F2/F3）
    const formants: [number, number, number][] = [
      [620, 4.5, 1.0], // F1 喉音
      [1800, 5.5, 0.7], // F2 腔音
      [3200, 7.0, 0.45], // F3 高频锐度
    ];

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.exponentialRampToValueAtTime(gain, startTime + 0.02);
    env.gain.setValueAtTime(gain, startTime + duration * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    for (const [f, q, g] of formants) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const fg = ctx.createGain();
      fg.gain.value = g;
      saw.connect(bp).connect(fg).connect(env);
    }
    env.connect(out);

    saw.start(startTime);
    saw.stop(startTime + duration + 0.05);
    lfo.start(startTime);
    lfo.stop(startTime + duration + 0.05);

    // 呼吸噪声叠在声音上（带通 500~2500Hz 模拟喉部湍流）
    if (breath > 0) {
      this.playNoise(ctx, out, duration, breath, 1400, startTime, 'bandpass');
    }
  }

  /** 短促"咯——"一声（选中小鸡时触发，轻巧友好） */
  private playCluck(ctx: AudioContext, out: GainNode, t: number) {
    // 起音"k"：短高频噪声点
    this.playNoise(ctx, out, 0.015, 0.32, 4200, t, 'highpass');
    // 主体 "ok" 下滑元音
    this.chickenVoice(ctx, out, t + 0.012, 0.18, 950, 540, 0.28, { vibrato: 18, breath: 0.09 });
    // 尾音短 "k" 收口
    this.playNoise(ctx, out, 0.02, 0.18, 4000, t + 0.18, 'highpass');
  }

  /** 鸡惊叫 —— 被抓住瞬间 "KEH-KEH-KEH-KEEEEEEH!!" 连叫 */
  private playSquawk(ctx: AudioContext, out: GainNode, t: number) {
    // 第 1 声惊叫：从天上急降（突然被吓到）
    this.playNoise(ctx, out, 0.02, 0.42, 4500, t, 'highpass');
    this.chickenVoice(ctx, out, t + 0.015, 0.22, 1650, 720, 0.4, {
      vibrato: 28,
      vibratoRate: 18,
      breath: 0.14,
    });

    // 连续三声短促惊叫 "咕！咕！咕！"
    const bursts = [
      { freq: [1400, 700], dt: 0.28 },
      { freq: [1550, 780], dt: 0.42 },
      { freq: [1300, 650], dt: 0.56 },
    ];
    for (const b of bursts) {
      this.playNoise(ctx, out, 0.015, 0.3, 4000, t + b.dt, 'highpass');
      this.chickenVoice(ctx, out, t + b.dt + 0.01, 0.14, b.freq[0], b.freq[1], 0.32, {
        vibrato: 22,
        vibratoRate: 20 + Math.random() * 6,
        breath: 0.11,
      });
    }

    // 尾音长嘶 "——！" 从高拉到低，颤音剧烈
    this.chickenVoice(ctx, out, t + 0.78, 0.42, 1380, 480, 0.32, {
      vibrato: 36,
      vibratoRate: 14,
      breath: 0.14,
    });
  }

  private playChime(ctx: AudioContext, out: GainNode, t: number) {
    // 三音和弦
    [523, 659, 784].forEach((f, i) =>
      this.blip(ctx, out, f, 0.45, 'sine', 0.22, t + i * 0.04),
    );
  }

  private playModal(ctx: AudioContext, out: GainNode, t: number) {
    // 弹窗轻盈出现
    this.blip(ctx, out, 880, 0.12, 'sine', 0.18, t);
    this.blip(ctx, out, 1320, 0.1, 'triangle', 0.12, t + 0.04);
  }

  // ============================================================
  //  BGM 合成器（每首仅 4~6 秒，一次性，无循环）
  // ============================================================

  /** 持续音（弦乐 / 铜管 pad），自动 fade-in / fade-out。 */
  private pad(
    ctx: AudioContext,
    out: GainNode,
    freq: number,
    duration: number,
    startTime: number,
    type: OscillatorType,
    peakGain: number,
    cutoff: number,
    attack = 0.25,
    release = 0.4,
  ) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.6;
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    g.gain.setValueAtTime(peakGain, startTime + duration - release);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(filter).connect(g).connect(out);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /** 抓鸡屏入场 —— 6s 紧张 timpani 滚奏 + 弦乐爬升 */
  private bgmAnticipation(ctx: AudioContext, out: GainNode, t: number) {
    for (let i = 0; i < 12; i++) {
      const beat = t + i * 0.45;
      const intensity = 0.2 + (i / 12) * 0.45;
      this.blip(ctx, out, 80 - i * 1.5, 0.28, 'sine', intensity * 0.4, beat, 45);
      this.playNoise(ctx, out, 0.15, intensity * 0.18, 220, beat, 'lowpass');
    }
    const cmin = [130.8, 155.6, 196.0];
    cmin.forEach((f) => this.pad(ctx, out, f, 5.6, t + 0.1, 'sawtooth', 0.06, 900, 0.6, 1.0));
    this.pad(ctx, out, 392.0, 3.5, t + 2.4, 'sawtooth', 0.05, 1400, 0.6, 0.8);
    this.playNoise(ctx, out, 1.2, 0.16, 4500, t + 4.4, 'highpass');
    this.blip(ctx, out, 65, 0.45, 'sine', 0.42, t + 5.5, 35);
  }

  /** 决胜轮 splash —— 4s 大鼓 + 铜管短动机 */
  private bgmDecisive(ctx: AudioContext, out: GainNode, t: number) {
    this.blip(ctx, out, 55, 0.55, 'sine', 0.7, t, 28);
    this.playNoise(ctx, out, 0.25, 0.5, 350, t, 'lowpass');
    this.playNoise(ctx, out, 0.6, 0.32, 5500, t, 'highpass');
    [
      { f: 261.6, dt: 0.6 },
      { f: 329.6, dt: 0.85 },
      { f: 392.0, dt: 1.1 },
      { f: 523.3, dt: 1.4 },
    ].forEach(({ f, dt }) => this.blip(ctx, out, f, 0.32, 'sawtooth', 0.18, t + dt));
    [261.6, 329.6, 392.0].forEach((f) =>
      this.pad(ctx, out, f, 2.0, t + 1.7, 'sawtooth', 0.16, 2200, 0.15, 0.9),
    );
    this.blip(ctx, out, 1046, 0.18, 'triangle', 0.14, t + 1.9);
    this.blip(ctx, out, 1175, 0.18, 'triangle', 0.14, t + 2.05);
    this.blip(ctx, out, 1318, 0.22, 'triangle', 0.16, t + 2.2);
    this.blip(ctx, out, 65, 0.45, 'sine', 0.5, t + 3.5, 28);
  }

  /** 胜利 fanfare —— 5s 上行琶音 + 持续大调和弦 */
  private bgmFanfareWin(ctx: AudioContext, out: GainNode, t: number) {
    [
      { f: 261.6, dt: 0.0 },
      { f: 329.6, dt: 0.18 },
      { f: 392.0, dt: 0.36 },
      { f: 523.3, dt: 0.54 },
      { f: 659.3, dt: 0.72 },
      { f: 784.0, dt: 0.9 },
      { f: 1046.5, dt: 1.1 },
    ].forEach(({ f, dt }) => this.blip(ctx, out, f, 0.28, 'triangle', 0.22, t + dt));
    [261.6, 329.6, 392.0, 523.3].forEach((f) =>
      this.pad(ctx, out, f, 3.4, t + 1.4, 'sawtooth', 0.14, 2400, 0.2, 1.5),
    );
    this.playNoise(ctx, out, 0.4, 0.18, 5000, t, 'highpass');
    this.playNoise(ctx, out, 0.5, 0.22, 5000, t + 1.4, 'highpass');
    [1568, 2093].forEach((f, i) =>
      this.blip(ctx, out, f, 0.3, 'sine', 0.12, t + 3.5 + i * 0.15),
    );
  }

  /** 失败 fanfare —— 5s 下行小调 + 凝重低音 */
  private bgmFanfareLose(ctx: AudioContext, out: GainNode, t: number) {
    [
      { f: 440.0, dt: 0.0 },
      { f: 392.0, dt: 0.32 },
      { f: 349.2, dt: 0.64 },
      { f: 311.1, dt: 0.96 },
      { f: 293.7, dt: 1.28 },
    ].forEach(({ f, dt }) => this.blip(ctx, out, f, 0.5, 'sawtooth', 0.18, t + dt));
    [146.8, 174.6, 207.7, 246.9].forEach((f) =>
      this.pad(ctx, out, f, 3.0, t + 1.6, 'sawtooth', 0.12, 1100, 0.25, 1.5),
    );
    this.blip(ctx, out, 60, 0.5, 'sine', 0.45, t, 30);
    this.blip(ctx, out, 55, 0.6, 'sine', 0.4, t + 1.6, 28);
    this.blip(ctx, out, 174.6, 0.4, 'sawtooth', 0.18, t + 4.0, 164.8);
    this.blip(ctx, out, 164.8, 0.5, 'sawtooth', 0.16, t + 4.4, 174.6);
  }
}

export const sound = new SoundManager();
export type { SfxName };

// HMR 兜底:Vite 热更新本模块时,先把旧实例的 AudioContext + 所有源彻底关掉,
// 防止"修改音效代码后旧的鬼影 BGM 还在后台疯狂响"。
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    try {
      sound.destroy();
    } catch {
      /* ignore */
    }
  });
}
