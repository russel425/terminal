const symbols = [
  { symbol: "AAPL", price: 195.42, change: 1.2, vol: "18.4M" },
  { symbol: "MSFT", price: 426.11, change: 0.6, vol: "14.2M" },
  { symbol: "NVDA", price: 901.55, change: -0.8, vol: "39.6M" },
  { symbol: "TSLA", price: 183.73, change: -1.4, vol: "26.8M" },
  { symbol: "AMZN", price: 178.24, change: 0.9, vol: "17.0M" },
  { symbol: "META", price: 502.64, change: 1.8, vol: "11.3M" }
];

const headlinePool = [
  { source: "SIM", text: "Fed official signals inflation progress but says policy remains data dependent." },
  { source: "SIM", text: "US 2Y yield slips 6 bps as traders increase odds of a cut by year-end." },
  { source: "SIM", text: "Brent crude turns lower after a larger-than-expected inventory build." },
  { source: "SIM", text: "Cloud infrastructure spend seen accelerating amid enterprise AI deployment." },
  { source: "SIM", text: "Dollar index eases as risk appetite improves in late New York session." },
  { source: "SIM", text: "Gold edges higher as real yields retreat and geopolitical risk premium rebuilds." }
];

const watchlistBody = document.getElementById("watchlistBody");
const blotterBody = document.getElementById("blotterBody");
const bidBook = document.getElementById("bidBook");
const askBook = document.getElementById("askBook");
const tape = document.getElementById("tape");
const newsFeed = document.getElementById("newsFeed");
const newsUpdatedAt = document.getElementById("newsUpdatedAt");
const newsSource = document.getElementById("newsSource");
const portfolioCards = document.getElementById("portfolioCards");
const chart = document.getElementById("priceChart");
const ctx = chart.getContext("2d");

let selected = symbols[0];
let points = generateSeries(90, selected.price);
let lastHeadlineHash = "";

function renderWatchlist() {
  watchlistBody.innerHTML = "";
  symbols.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.symbol}</td>
      <td>${item.price.toFixed(2)}</td>
      <td class="${item.change >= 0 ? "up" : "down"}">${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)}%</td>
      <td>${item.vol}</td>
    `;
    tr.style.cursor = "pointer";
    tr.onclick = () => {
      selected = item;
      document.getElementById("chartTitle").textContent = `${selected.symbol} · Intraday`;
      points = generateSeries(90, selected.price);
      drawChart(points);
      buildOrderBook();
    };
    watchlistBody.appendChild(tr);
  });
}

function renderPortfolio() {
  const cards = [
    ["NAV", "$12.48M"],
    ["Day P/L", "+$184,220"],
    ["Gross Exp", "$22.10M"],
    ["Net Exp", "$7.94M"],
    ["Sharpe", "2.14"],
    ["Win Rate", "61%"]
  ];
  cards.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
    portfolioCards.appendChild(card);
  });
}

function addTradeToBlotter(order) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td class="${order.side === "BUY" ? "up" : "down"}">${order.side}</td>
    <td>${order.symbol}</td>
    <td>${order.qty}</td>
    <td>${Number(order.price).toFixed(2)}</td>
    <td>FILLED</td>
  `;
  blotterBody.prepend(tr);
}

function buildOrderBook() {
  bidBook.innerHTML = "";
  askBook.innerHTML = "";
  tape.innerHTML = "";

  for (let i = 0; i < 8; i += 1) {
    const bid = (selected.price - Math.random() * 0.7).toFixed(2);
    const ask = (selected.price + Math.random() * 0.7).toFixed(2);
    const size = Math.floor(Math.random() * 2000 + 100);

    bidBook.innerHTML += `<li><span>${bid}</span><span>${size}</span></li>`;
    askBook.innerHTML += `<li><span>${ask}</span><span>${size}</span></li>`;

    const sideClass = Math.random() > 0.5 ? "up" : "down";
    const tradePx = (selected.price + (Math.random() - 0.5) * 0.9).toFixed(2);
    tape.innerHTML += `<li><span>${tradePx}</span><span class="${sideClass}">${Math.floor(Math.random() * 900 + 50)}</span></li>`;
  }
}

function addHeadline({ source, text }, isBreaking = false) {
  const li = document.createElement("li");
  const stamp = new Date().toLocaleTimeString();
  li.innerHTML = `
    <span class="news-meta">${stamp} · ${source}${isBreaking ? " · BREAKING" : ""}</span>
    <span>${text}</span>
  `;

  if (isBreaking) {
    li.classList.add("breaking");
  }

  newsFeed.prepend(li);

  const maxNewsRows = 20;
  while (newsFeed.children.length > maxNewsRows) {
    newsFeed.removeChild(newsFeed.lastChild);
  }

  newsUpdatedAt.textContent = `Updated ${stamp}`;
}

function renderNewsSeed() {
  headlinePool.slice(0, 4).forEach((entry) => addHeadline(entry));
  newsSource.textContent = "Source: Simulated seed";
}

async function fetchYahooFinanceNews() {
  const endpoint = "https://query1.finance.yahoo.com/v1/finance/search?q=market&newsCount=8";
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.news || !payload.news.length) {
    throw new Error("No news in payload");
  }

  const first = payload.news[0];
  const title = first.title || first.shortname;
  if (!title) {
    throw new Error("No title");
  }

  const hash = `${title}-${first.providerPublishTime || ""}`;
  if (hash === lastHeadlineHash) {
    return false;
  }

  lastHeadlineHash = hash;
  addHeadline(
    {
      source: first.publisher || "Yahoo",
      text: title
    },
    /breaking|urgent|surge|plunge/i.test(title)
  );
  newsSource.textContent = "Source: Yahoo Finance search API (polled)";
  return true;
}

function publishSimulatedHeadline() {
  const entry = headlinePool[Math.floor(Math.random() * headlinePool.length)];
  const breaking = Math.random() > 0.75;
  addHeadline(entry, breaking);
  newsSource.textContent = "Source: Simulated fallback";
}

async function refreshNews() {
  try {
    const updated = await fetchYahooFinanceNews();
    if (!updated) {
      newsSource.textContent = "Source: Yahoo Finance search API (no new headline)";
    }
  } catch (_error) {
    publishSimulatedHeadline();
  }
}

function generateSeries(length, anchor) {
  const values = [];
  let current = anchor;
  for (let i = 0; i < length; i += 1) {
    current += (Math.random() - 0.5) * 0.9;
    values.push(Number(current.toFixed(2)));
  }
  return values;
}

function drawChart(series) {
  ctx.clearRect(0, 0, chart.width, chart.height);
  const min = Math.min(...series) - 0.5;
  const max = Math.max(...series) + 0.5;
  const pad = 26;

  ctx.strokeStyle = "rgba(123,100,56,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = pad + ((chart.height - pad * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(chart.width - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  series.forEach((v, i) => {
    const x = pad + (i / (series.length - 1)) * (chart.width - pad * 2);
    const y = chart.height - pad - ((v - min) / (max - min)) * (chart.height - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const gradient = ctx.createLinearGradient(0, 0, chart.width, 0);
  gradient.addColorStop(0, "#f2c98a");
  gradient.addColorStop(1, "#d58a4b");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

function wireInteractions() {
  document.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const sizeByRange = { "1H": 90, "1D": 180, "1W": 260 };
      points = generateSeries(sizeByRange[btn.dataset.range], selected.price);
      drawChart(points);
    });
  });

  document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      symbol: document.getElementById("symbolInput").value.toUpperCase(),
      side: document.getElementById("sideInput").value,
      qty: document.getElementById("qtyInput").value,
      price: document.getElementById("priceInput").value
    };
    addTradeToBlotter(payload);
  });
}

function pulse() {
  symbols.forEach((item) => {
    const delta = (Math.random() - 0.5) * 0.3;
    item.price = Number((item.price + delta).toFixed(2));
    item.change = Number((item.change + delta / 5).toFixed(2));
  });
  renderWatchlist();
  buildOrderBook();
  document.getElementById("latency").textContent = `${Math.floor(Math.random() * 18 + 21)}ms`;
}

renderWatchlist();
renderPortfolio();
renderNewsSeed();
buildOrderBook();
drawChart(points);
wireInteractions();
refreshNews();
setInterval(pulse, 2200);
setInterval(refreshNews, 15000);
