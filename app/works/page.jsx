export const metadata = {
  title: "精选作品｜孙苏阳",
  description: "孙苏阳的视觉设计、IP 运营、AIGC 与品牌作品。",
};

export default function WorksPage() {
  return (
    <main className="portfolio-frame-shell">
      <iframe
        className="portfolio-frame"
        src="/portfolio-effects/works.html"
        title="孙苏阳精选作品"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
