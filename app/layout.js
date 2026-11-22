import './globals.css';

export const metadata = {
  title: 'Payday · Budget, taxes and an AI money coach',
  description: 'Turn a paycheck into a plan: estimate 2026 taxes, build a budget, track spending and learn money basics with an AI coach.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3f5f7' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
