// Daily reel template for ThinkwithClaude. Content comes from public/reel.json,
// timing from public/timings.json (made by reels/make_timings.py). See reels/README.md.
import React from "react";
import {
  registerRoot, Composition, AbsoluteFill, Audio, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, interpolate, spring, Easing,
} from "remotion";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import reel from "../public/reel.json";
import timings from "../public/timings.json";

const DM = "'DM Sans', sans-serif";
const INTER = "'Inter', sans-serif";
const C = { navy: "#004AAD", sky: "#38B6FF", dark: "#1C1A17", white: "#FFFFFF", red: "#E5484D" };
const FPS = 30;
const TAIL = 2.0; // seconds of end card after the last word

function bounds() {
  const n = reel.scenes.length;
  const raw = reel.scenes.map((_, s) => {
    const mine = timings.segments.filter((x) => x.scene === s);
    return { start: mine[0].start, end: mine[mine.length - 1].end };
  });
  return raw.map((x, i) => {
    const from = i === 0 ? 0 : Math.max(0, x.start - 0.15);
    const to = i === n - 1 ? timings.total + TAIL : raw[i + 1].start - 0.15;
    return { from: Math.round(from * FPS), dur: Math.max(1, Math.round((to - from) * FPS)) };
  });
}

const useIn = (delay = 0) => spring({ frame: useCurrentFrame() - delay, fps: FPS, config: { damping: 16, mass: 0.7 } });

const Title = ({ children, size = 82, delay = 0, style }) => {
  const p = useIn(delay);
  return <div style={{ fontFamily: DM, fontWeight: 700, fontSize: size, lineHeight: 1.12, color: C.white, textAlign: "center",
    opacity: p, transform: `translateY(${(1 - p) * 40}px)`, letterSpacing: -1, ...style }}>{children}</div>;
};

// "word **highlight** word" -> highlighted spans in sky blue
const Hi = ({ text }) => (
  <>{String(text).split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") ? <span key={i} style={{ color: C.sky }}>{part.slice(2, -2)}</span> : <span key={i}>{part}</span>)}</>
);

const Tick = ({ label, delay }) => {
  const p = useIn(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: p, transform: `translateX(${(1 - p) * -40}px)`,
      fontFamily: INTER, fontSize: 46, fontWeight: 600, color: C.white, margin: "18px 0" }}>
      <div style={{ flex: "0 0 62px", width: 62, height: 62, borderRadius: 31, background: C.sky, color: C.dark, display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, transform: `scale(${p})` }}>✓</div>
      <span>{label}</span>
    </div>
  );
};

const Bg = ({ children }) => {
  const y = interpolate(useCurrentFrame(), [0, 300], [0, -60], { extrapolateRight: "extend" });
  return (
    <AbsoluteFill style={{ background: C.dark, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: 450, left: -300, top: 200 + y,
        background: `radial-gradient(circle, ${C.navy}66, transparent 70%)` }} />
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: 350, right: -250, top: 1000 - y,
        background: `radial-gradient(circle, ${C.sky}33, transparent 70%)` }} />
      <AbsoluteFill style={{ padding: "160px 80px 620px", justifyContent: "center", alignItems: "center" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// Big emoji/icon badge used on hook and point scenes
const Icon = ({ icon, delay = 0 }) => {
  const p = useIn(delay);
  const f = useCurrentFrame();
  return (
    <div style={{ width: 300, height: 300, borderRadius: 64, marginBottom: 70, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 150, background: `linear-gradient(145deg, ${C.navy}, #0B2A5C)`,
      boxShadow: `0 20px 60px rgba(0,0,0,.45), 0 0 0 6px ${C.sky}33`, opacity: p,
      transform: `scale(${0.7 + 0.3 * p}) rotate(${Math.sin(f / 18) * 3}deg)` }}>{icon}</div>
  );
};

const Hook = ({ s }) => {
  const f = useCurrentFrame();
  const stamp = spring({ frame: f - 30, fps: FPS, config: { damping: 9 } });
  return (
    <Bg>
      {s.icon ? <Icon icon={s.icon} /> : null}
      <Title size={88} delay={6}><Hi text={s.title} /></Title>
      {s.stamp ? <div style={{ marginTop: 50, fontFamily: DM, fontWeight: 800, fontSize: 72, color: C.red,
        border: `7px solid ${C.red}`, borderRadius: 16, padding: "4px 26px", opacity: stamp,
        transform: `rotate(-8deg) scale(${2 - stamp})` }}>{s.stamp}</div> : null}
    </Bg>
  );
};

const Point = ({ s }) => (
  <Bg>
    {s.icon ? <Icon icon={s.icon} /> : null}
    <Title size={76} delay={6}><Hi text={s.title} /></Title>
    {s.sub ? <div style={{ marginTop: 34, fontFamily: INTER, fontWeight: 600, fontSize: 44, color: "#C9D3E3", textAlign: "center",
      opacity: useIn(16) }}>{s.sub}</div> : null}
  </Bg>
);

const List = ({ s, dur }) => {
  const items = s.items || [];
  const step = Math.max(12, Math.floor((dur - 30) / Math.max(1, items.length)));
  return (
    <Bg>
      <Title size={70} style={{ marginBottom: 50 }}><Hi text={s.title} /></Title>
      <div style={{ maxWidth: 900 }}>{items.map((t, i) => <Tick key={i} label={t} delay={14 + i * step} />)}</div>
    </Bg>
  );
};

const Cta = () => {
  const f = useCurrentFrame();
  const p = useIn(4), q = useIn(30);
  return (
    <AbsoluteFill style={{ background: C.navy, justifyContent: "center", alignItems: "center", padding: "0 80px 300px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, marginBottom: 90 }}>
        <div style={{ width: 110, height: 110, borderRadius: 55, background: `linear-gradient(135deg, ${C.sky}, #F5B301)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM, fontWeight: 800, fontSize: 44, color: C.white }}>SA</div>
        <div style={{ fontFamily: DM, fontWeight: 700, fontSize: 60, color: C.white }}>ThinkwithClaude</div>
      </div>
      <div style={{ fontFamily: INTER, fontSize: 48, color: "#D6E4FF", opacity: p }}>Visit us today at</div>
      <div style={{ fontFamily: DM, fontWeight: 800, fontSize: 84, color: C.white, opacity: p,
        transform: `scale(${1 + 0.03 * Math.sin(f / 6)})`, margin: "12px 0 60px" }}>thinkwithclaude.com</div>
      <div style={{ fontFamily: INTER, fontSize: 48, color: "#D6E4FF", opacity: q }}>or call us at</div>
      <div style={{ marginTop: 18, background: C.white, color: C.navy, fontFamily: DM, fontWeight: 800, fontSize: 74,
        padding: "18px 46px", borderRadius: 999, opacity: q, transform: `scale(${0.9 + 0.1 * q})` }}>📞 7042633107</div>
    </AbsoluteFill>
  );
};

const KIND = { hook: Hook, point: Point, list: List, cta: Cta };

const Captions = () => {
  const t = useCurrentFrame() / FPS;
  const seg = timings.segments.find((s) => t >= s.start - 0.05 && t <= s.end + 0.2);
  if (!seg || reel.scenes[seg.scene]?.type === "cta") return null;
  const words = seg.caption.split(" ");
  const per = (seg.end - seg.start) / words.length;
  const cur = Math.min(words.length - 1, Math.floor((t - seg.start) / per));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 420 }}>
      <div style={{ maxWidth: 940, textAlign: "center", fontFamily: DM, fontWeight: 800, fontSize: 54, lineHeight: 1.25,
        color: C.white, textShadow: "0 4px 18px rgba(0,0,0,.8)", background: "rgba(28,26,23,.55)", padding: "16px 28px", borderRadius: 20 }}>
        {words.map((w, i) => <span key={i} style={{ color: i === cur ? C.sky : C.white }}>{w} </span>)}
      </div>
    </AbsoluteFill>
  );
};

const SlideIn = ({ children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `translateY(${interpolate(f, [0, 8], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}px)`,
    opacity: interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Reel = () => {
  const b = bounds();
  const { durationInFrames } = useVideoConfig();
  const musicVol = (fr) => interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.22, 0.22, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      {reel.scenes.map((s, i) => {
        const K = KIND[s.type] || Point;
        return <Sequence key={i} from={b[i].from} durationInFrames={b[i].dur}><SlideIn><K s={s} dur={b[i].dur} /></SlideIn></Sequence>;
      })}
      <Captions />
      <Audio src={staticFile("voiceover.wav")} />
      <Audio src={staticFile("music.wav")} volume={musicVol} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="Reel" component={Reel} fps={FPS} width={1080} height={1920}
    durationInFrames={Math.ceil((timings.total + TAIL) * FPS)} />
));
