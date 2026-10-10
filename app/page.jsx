"use client";

import { useEffect, useRef, useState } from "react";

const pages = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) =>
    `/portfolio/page-${String(start + i).padStart(2, "0")}.jpg`,
  );

const projects = [
  {
    no: "01",
    title: "工位出逃计划",
    en: "WORKSTATION ESCAPE PLAN",
    type: "AIGC 视觉设计",
    color: "#7BFF60",
    cover: "/portfolio/page-05.jpg",
    desc: "面向久坐办公人群的 5 分钟身体重启计划。用 AIGC 构建轻松、治愈且具有商业传播力的活动视觉。",
    tags: ["创意概念", "AIGC 视觉", "角色设定", "移动端界面"],
    images: pages(5, 13),
  },
  {
    no: "02",
    title: "盒马 × 海绵宝宝",
    en: "BIKINI FRESH LAND",
    type: "IP 联名企划",
    color: "#36A8FF",
    cover: "/portfolio/page-15.jpg",
    desc: "将盒马鲜活超市搬进比奇堡，用角色化消费场景完成从主视觉到会员卡、包装及户外传播的完整联名系统。",
    tags: ["联名概念", "主视觉 KV", "品牌系统", "包装传播"],
    images: pages(15, 31),
  },
  {
    no: "03",
    title: "YOUR MOOD TODAY",
    en: "LUCKIN COFFEE CAMPAIGN",
    type: "品牌运营设计",
    color: "#FFE84D",
    cover: "/portfolio/page-33.jpg",
    desc: "把今天的情绪转化为一杯专属咖啡，围绕六种情绪角色延展运营海报、周边、表情包和移动端体验。",
    tags: ["运营策划", "IP 角色", "系列海报", "活动界面"],
    images: pages(33, 47),
  },
  {
    no: "04",
    title: "青春未完待续",
    en: "BILIBILI H5 CAMPAIGN",
    type: "H5 活动设计",
    color: "#42D4FF",
    cover: "/showcase/bilibili-cover.png",
    desc: "以毕业季为叙事节点，从作品展、未来来信到留言墙，让青春被记录，也让离别成为新的更新。",
    tags: ["活动概念", "H5 视觉", "交互流程", "运营延展"],
    images: pages(49, 49),
  },
  {
    no: "05",
    title: "CAMPUS AI",
    en: "AI GROWTH COMPANION",
    type: "UI 产品设计",
    color: "#A287FF",
    cover: "/portfolio/page-65.jpg",
    desc: "围绕大学生成长路径模糊的问题，打造从目标输入、AI 分析、机会匹配到成长档案的校园成长助手。",
    tags: ["用户研究", "服务设计", "产品架构", "UI 设计"],
    images: pages(51, 65),
  },
];

const orbit = [
  "/orbit/new-08.jpg",
  "/orbit/new-04.jpg",
  "/orbit/new-03.jpg",
  "/orbit/new-09.jpg",
  "/orbit/new-10.jpg",
  "/orbit/new-07.jpg",
  "/orbit/new-05.jpg",
  "/orbit/new-01.jpg",
  "/orbit/new-02.jpg",
  "/orbit/new-06.jpg",
];
const ribbon = [6, 16, 34, 49, 52, 11, 22, 40, 58, 29]
  .map((n) => `/portfolio/page-${String(n).padStart(2, "0")}.jpg`);

function Detail({ project, close, move }) {
  useEffect(() => {
    document.body.classList.add("locked");
    const onKey = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useEffect(() => {
    const root = document.querySelector(".detail");
    const progress = root?.querySelector(".detail-progress");
    const figures = [...(root?.querySelectorAll(".gallery figure") || [])];
    if (!root) return;

    figures.forEach((figure, index) => {
      figure.classList.add("detail-reveal");
      figure.style.setProperty("--delay", `${Math.min(index, 5) * 55}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible"));
    }, { root, threshold: 0.08, rootMargin: "0px 0px -6%" });
    figures.forEach((figure) => observer.observe(figure));

    const updateProgress = () => {
      const max = root.scrollHeight - root.clientHeight;
      progress?.style.setProperty("--detail-progress", `${max > 0 ? root.scrollTop / max : 0}`);
    };
    root.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", updateProgress);
    };
  }, [project.no]);

  return (
    <div className="detail" style={{ "--accent": project.color }}>
      <div className="detail-progress" aria-hidden="true" />
      <div className="detail-bar">
        <button onClick={close}>SUSU / PORTFOLIO</button>
        <span>{project.no} / 05</span>
        <button onClick={close}>CLOSE ×</button>
      </div>
      <header className="detail-head">
        <small>{project.type} · SELECTED WORK 2026</small>
        <h2>{project.title}</h2>
        <h3>{project.en}</h3>
        <div className="detail-intro">
          <p>{project.desc}</p>
          <ul>{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        </div>
      </header>
      <div className={`gallery ${project.no === "04" ? "gallery-single" : ""}`}>
        {project.images.map((src, index) => (
          <figure key={src}>
            <img src={src} alt={`${project.title} ${index + 1}`} loading={index > 1 ? "lazy" : "eager"} />
            <span>{project.no}.{String(index + 1).padStart(2, "0")}</span>
          </figure>
        ))}
      </div>
      <footer className="detail-foot">
        <button onClick={() => move(-1)}>← PREV PROJECT</button>
        <span>SUN SUYANG · 2026</span>
        <button onClick={() => move(1)}>NEXT PROJECT →</button>
      </footer>
    </div>
  );
}

function WorkCard({ project, index, open }) {
  return (
    <button
      className="showcase-card"
      onClick={open}
      style={{ "--accent": project.color }}
      aria-label={`查看${project.title}项目`}
      data-cursor="OPEN"
    >
      <div className="showcase-card-top">
        <span className="showcase-category"><i />{project.type}</span>
        <span className="showcase-number">0{index + 1}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.desc}</p>
      <div className="showcase-cover"><img src={project.cover} alt={`${project.title}横版封面`} loading="lazy" /></div>
      <div className="showcase-action"><span>查看作品</span><b>→</b></div>
    </button>
  );
}

function WorksExperience() {
  const shellRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const shell = shellRef.current;
    const frame = frameRef.current;
    if (!shell || !frame) return;

    let frameWindow = frame.contentWindow;
    let scrollFrame = 0;

    const updateInteraction = () => {
      scrollFrame = 0;
      const bounds = shell.getBoundingClientRect();
      const fullyVisible = bounds.top <= 1 && bounds.bottom >= window.innerHeight - 1;
      frame.style.pointerEvents = fullyVisible ? "auto" : "none";
    };

    const onPageScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateInteraction);
    };

    const onFrameLoad = () => {
      frameWindow = frame.contentWindow;
      updateInteraction();
    };

    const onFrameMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== frameWindow) return;
      if (event.data?.type !== "works-original:boundary-wheel") return;
      const delta = Number(event.data.deltaY);
      const mode = Number(event.data.deltaMode);
      if (!Number.isFinite(delta)) return;
      const unit = mode === 1 ? 18 : mode === 2 ? window.innerHeight : 1;
      window.scrollBy({ top: delta * unit, left: 0, behavior: "auto" });
    };

    frame.addEventListener("load", onFrameLoad);
    window.addEventListener("scroll", onPageScroll, { passive: true });
    window.addEventListener("resize", onPageScroll, { passive: true });
    window.addEventListener("message", onFrameMessage);
    updateInteraction();

    return () => {
      cancelAnimationFrame(scrollFrame);
      frame.removeEventListener("load", onFrameLoad);
      window.removeEventListener("scroll", onPageScroll);
      window.removeEventListener("resize", onPageScroll);
      window.removeEventListener("message", onFrameMessage);
    };
  }, []);

  return (
    <section className="works-experience-shell" id="works" ref={shellRef}>
      <iframe
        ref={frameRef}
        className="works-experience-frame"
        src="/works-original/works.html#works"
        title="孙苏阳精选作品动态展示"
        allow="fullscreen"
      />
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState(null);
  const [heroEnded, setHeroEnded] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const heroVideo = useRef(null);
  const move = (direction) => {
    setActive((current) => (current + direction + projects.length) % projects.length);
    requestAnimationFrame(() => document.querySelector(".detail")?.scrollTo({ top: 0 }));
  };

  const replayHero = () => {
    const video = heroVideo.current;
    if (!video) return;
    setHeroEnded(false);
    video.currentTime = 0;
    video.play().catch(() => setHeroEnded(true));
  };

  useEffect(() => {
    if (!badgeOpen) return;
    document.body.classList.add("locked");
    const closeBadge = (event) => event.key === "Escape" && setBadgeOpen(false);
    window.addEventListener("keydown", closeBadge);
    return () => {
      document.body.classList.remove("locked");
      window.removeEventListener("keydown", closeBadge);
    };
  }, [badgeOpen]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const root = document.documentElement;
    const progress = document.querySelector(".scroll-progress");
    const cursor = document.querySelector(".cursor-orb");
    const cursorLabel = cursor?.querySelector("span");
    const hero = document.querySelector(".hero");
    const orbitEl = document.querySelector(".orbit");
    const orbitCards = [...document.querySelectorAll(".orbit-card")];
    const collageImages = [...document.querySelectorAll(".statement-collage img")];
    const tiltCards = [...document.querySelectorAll(".showcase-card")];
    let scrollFrame = 0;
    let orbitFrame = 0;
    let orbitVisible = true;
    let orbitPointerX = 0;
    let orbitPointerY = 0;
    let orbitTargetX = 0;
    let orbitTargetY = 0;

    const revealTargets = [
      ...document.querySelectorAll(".statement-copy > *, .recent-heading > *, .showcase-head > *, .showcase-card, .slogan p, .footer-grid > div"),
    ];

    if (!reduced) {
      revealTargets.forEach((node, index) => {
        node.classList.add("motion-reveal");
        node.style.setProperty("--delay", `${(index % 6) * 70}ms`);
      });
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible"));
      }, { threshold: 0.1, rootMargin: "0px 0px -7%" });
      revealTargets.forEach((node) => observer.observe(node));
      window.__susuMotionObserver = observer;
    } else {
      root.classList.add("reduce-motion");
    }

    const updateScroll = () => {
      scrollFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progress?.style.setProperty("--scroll-progress", `${ratio}`);
      root.style.setProperty("--scroll-shift", `${Math.min(window.scrollY * 0.045, 42)}px`);

      collageImages.forEach((image, index) => {
        const rect = image.getBoundingClientRect();
        const distance = rect.top + rect.height / 2 - window.innerHeight / 2;
        const strength = 0.025 + (index % 3) * 0.012;
        image.style.setProperty("--parallax", `${Math.max(-34, Math.min(34, -distance * strength))}px`);
      });
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateScroll();

    const cleanups = [];
    if (!reduced && orbitEl && orbitCards.length) {
      orbitEl.classList.add("motion-orbit");
      const orbitObserver = new IntersectionObserver((entries) => {
        orbitVisible = entries[0]?.isIntersecting ?? true;
      }, { threshold: 0.02 });
      orbitObserver.observe(orbitEl);

      const animateOrbit = (time) => {
        if (orbitVisible) {
          orbitPointerX += (orbitTargetX - orbitPointerX) * 0.055;
          orbitPointerY += (orbitTargetY - orbitPointerY) * 0.055;
          const width = orbitEl.clientWidth;
          const height = orbitEl.clientHeight;

          orbitCards.forEach((card, index) => {
            const outer = index < 6;
            const localIndex = outer ? index : index - 6;
            const count = outer ? 6 : 4;
            const direction = outer ? 1 : -1;
            const speed = outer ? 0.00017 : 0.000225;
            const angle = direction * time * speed + localIndex * Math.PI * 2 / count;
            const radiusX = width * (outer ? 0.405 : 0.275);
            const radiusY = height * (outer ? 0.31 : 0.205);
            const depth = (Math.sin(angle) + 1) / 2;
            const x = Math.cos(angle) * radiusX + orbitPointerX * (outer ? 22 : 13);
            const y = Math.sin(angle) * radiusY + orbitPointerY * (outer ? 15 : 9);
            const scale = (outer ? 0.76 : 0.66) + depth * (outer ? 0.28 : 0.22);
            const rotate = Math.cos(angle) * (outer ? 5 : 3);

            card.style.setProperty("--orbit-transform", `translate3d(calc(-50% + ${x}px),calc(-50% + ${y}px),0) scale(${scale}) rotate(${rotate}deg)`);
            card.style.setProperty("--orbit-opacity", `${0.58 + depth * 0.42}`);
            card.style.setProperty("--orbit-brightness", `${0.7 + depth * 0.36}`);
            card.style.zIndex = `${2 + Math.round(depth * 12)}`;
          });
        }
        orbitFrame = requestAnimationFrame(animateOrbit);
      };
      orbitFrame = requestAnimationFrame(animateOrbit);
      cleanups.push(() => {
        cancelAnimationFrame(orbitFrame);
        orbitObserver.disconnect();
        orbitEl.classList.remove("motion-orbit");
      });
    }

    if (!reduced && finePointer) {
      document.body.classList.add("motion-on");

      const moveCursor = (event) => {
        cursor?.style.setProperty("--cursor-x", `${event.clientX}px`);
        cursor?.style.setProperty("--cursor-y", `${event.clientY}px`);
      };
      const cursorOver = (event) => {
        const target = event.target.closest?.("[data-cursor], a, button");
        cursor?.classList.toggle("is-active", Boolean(target));
        if (cursorLabel) cursorLabel.textContent = target?.dataset?.cursor || "";
      };
      const cursorDown = () => cursor?.classList.add("is-down");
      const cursorUp = () => cursor?.classList.remove("is-down");
      window.addEventListener("pointermove", moveCursor, { passive: true });
      document.addEventListener("pointerover", cursorOver, { passive: true });
      document.addEventListener("pointerdown", cursorDown, { passive: true });
      document.addEventListener("pointerup", cursorUp, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("pointermove", moveCursor);
        document.removeEventListener("pointerover", cursorOver);
        document.removeEventListener("pointerdown", cursorDown);
        document.removeEventListener("pointerup", cursorUp);
      });

      const heroMove = (event) => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--hero-x", `${((event.clientX - rect.left) / rect.width - .5) * 12}px`);
        hero.style.setProperty("--hero-y", `${((event.clientY - rect.top) / rect.height - .5) * 10}px`);
      };
      const heroLeave = () => {
        hero.style.setProperty("--hero-x", "0px");
        hero.style.setProperty("--hero-y", "0px");
      };
      hero?.addEventListener("pointermove", heroMove, { passive: true });
      hero?.addEventListener("pointerleave", heroLeave, { passive: true });
      cleanups.push(() => {
        hero?.removeEventListener("pointermove", heroMove);
        hero?.removeEventListener("pointerleave", heroLeave);
      });

      const orbitMove = (event) => {
        const rect = orbitEl.getBoundingClientRect();
        orbitTargetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
        orbitTargetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
      };
      const orbitLeave = () => {
        orbitTargetX = 0;
        orbitTargetY = 0;
      };
      orbitEl?.addEventListener("pointermove", orbitMove, { passive: true });
      orbitEl?.addEventListener("pointerleave", orbitLeave, { passive: true });
      cleanups.push(() => {
        orbitEl?.removeEventListener("pointermove", orbitMove);
        orbitEl?.removeEventListener("pointerleave", orbitLeave);
      });

      tiltCards.forEach((card) => {
        const tilt = (event) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
          card.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
          card.style.setProperty("--spot-x", `${x * 100}%`);
          card.style.setProperty("--spot-y", `${y * 100}%`);
        };
        const reset = () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--spot-x", "50%");
          card.style.setProperty("--spot-y", "50%");
        };
        card.addEventListener("pointermove", tilt, { passive: true });
        card.addEventListener("pointerleave", reset, { passive: true });
        cleanups.push(() => {
          card.removeEventListener("pointermove", tilt);
          card.removeEventListener("pointerleave", reset);
        });
      });
    }

    return () => {
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.__susuMotionObserver?.disconnect();
      delete window.__susuMotionObserver;
      document.body.classList.remove("motion-on");
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-orb" aria-hidden="true"><span /></div>
      <a className="brand-badge" href="#hero" aria-label="返回首页" onClick={() => setActive(null)}>
        <img src="/brand/susu-cutout.png" alt="" />
      </a>
      <main>
        <section className="home-embed-shell" id="hero">
          <iframe
            className="home-embed-frame"
            src="/portfolio-effects/home.html"
            title="孙苏阳视觉设计作品集首页"
            allow="autoplay; fullscreen"
          />
        </section>

        <section className="creative" id="creative">
          <div className="orbit" aria-label="portfolio orbit">
            {orbit.map((src, index) => <div className={`orbit-card orbit-${index + 1}`} data-cursor="MOVE" key={src}><img src={src} alt={`作品缩略图 ${index + 1}`} /></div>)}
            <div className="avatar-wrap"><img src="/brand/susu-cutout.png" alt="孙苏阳的女生角色" /></div>
            <div className="orbit-copy"><small>SUSU&apos;S</small><strong>CREATIVE <i>AI</i></strong><span>MOVE · HOVER · EXPLORE</span></div>
          </div>
        </section>

        <section className="statement" id="about">
          <div className="statement-copy">
            <p className="eyebrow">DESIGNER&apos;S WORDS</p>
            <h2>让 <span className="hot-pink">AI</span> 放大想象，<br />让设计判断<br />决定最终表达。</h2>
            <div className="statement-text">
              <p>我是孙苏阳，中国地质大学（武汉）数字媒体艺术专业本科在读，专注 AIGC 视觉、品牌运营与数字体验。</p>
              <p>我习惯从调研与概念出发，让 AI 参与发散，再通过精修、排版与系统化延展，把灵感变成可使用、可传播的设计。</p>
            </div>
          </div>
          <div className="statement-collage">
            {[
              "/collage/third-01.png",
              "/collage/third-02.png",
              "/collage/third-03.jpg",
              "/collage/third-04.png",
              "/collage/third-05.png",
            ].map((src, index) => <img className={`collage-${index + 1}`} key={src} src={src} alt="设计作品" />)}
          </div>
        </section>

        <section className="recent">
          <div className="recent-heading"><h2>Recent<br />WOrK<span className="hot-pink">s</span></h2><p>HEY CREATIVE DESIGN<br />JUST FOR @FUTURE</p></div>
          <div className="ribbon"><div>{[...ribbon, ...ribbon].map((src, index) => <img key={`${src}-${index}`} src={src} alt="近期作品" loading="lazy" />)}</div></div>
        </section>

        <WorksExperience />

        <section className="slogan" aria-label="Stop overthinking. Just do it. For future.">
          <p className="kinetic-line kinetic-line-a"><span>STOP</span><span>OVERTHINKING</span></p>
          <p className="kinetic-line kinetic-line-b"><span>JUST</span><span>DO</span><span className="hot-pink kinetic-it">IT</span></p>
          <p className="kinetic-line kinetic-line-c"><span>FOR</span><span>FUTURE</span></p>
        </section>

        <footer className="footer" id="contact">
          <div className="footer-hero"><img src="/brand/susu-cutout.png" alt="孙苏阳女生角色" /><h2>SUSU<br />VISUAL<br />DESIGN<span className="hot-pink">ER</span></h2></div>
          <div className="footer-grid">
            <div><small>PROFILE</small><p>孙苏阳<br />中国地质大学（武汉）<br />数字媒体艺术 · 2027</p></div>
            <div><small>FOCUS</small><p>AIGC 视觉<br />品牌运营设计<br />互联网活动视觉</p></div>
            <div><small>CONTACT</small><p><a href="mailto:susuyyyy1@gmail.com">susuyyyy1@gmail.com ↗</a><br /><a href="tel:18396207080">183 9620 7080 ↗</a><br /><a href="/resume.pdf" download>下载简历 ↗</a></p></div>
          </div>
          <div className="footer-bottom"><span>© 2026 SUN SUYANG</span><a href="#hero">BACK TO TOP ↑</a></div>
        </footer>
      </main>

      {active !== null && <Detail project={projects[active]} close={() => setActive(null)} move={move} />}
      {badgeOpen && (
        <div className="badge-modal" role="dialog" aria-modal="true" aria-label="孙苏阳的设计师工牌" onClick={() => setBadgeOpen(false)}>
          <div className="badge-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="badge-close" type="button" onClick={() => setBadgeOpen(false)} aria-label="关闭工牌">CLOSE ×</button>
            <div className="badge-front-wrap">
              <img src="/hero/badge-front.png" alt="孙苏阳视觉设计师工牌正面" />
            </div>
            <div className="badge-actions">
              <div><small>SUYANG · RESUME</small><p>点击查看完整个人简历</p></div>
              <a href="/resume.pdf" target="_blank" rel="noreferrer">查看简历 PDF ↗</a>
              <a className="badge-download" href="/resume.pdf" download>下载 PDF ↓</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
