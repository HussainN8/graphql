export const renderRadarGraph = (data) => {
  const root = document.getElementById("radar-graph");
  if (!root) return;

  const svg = root.querySelector("#radar-svg");
  if (!svg) return;

  const axesG = svg.querySelector("#radar-axes");
  const dotsG = svg.querySelector("#radar-dots");
  const labelsG = svg.querySelector("#radar-labels");
  const shape = svg.querySelector("#radar-shape");
  const capText = svg.querySelector("#radar-cap");

  if (!axesG || !dotsG || !labelsG || !shape || !capText) return;

  const entries = Object.entries(data || {})
    .map(([k, v]) => [String(k), Number(v) || 0])
    .sort((a, b) => b[1] - a[1]);

  // Clear if empty
  if (!entries.length) {
    axesG.replaceChildren();
    dotsG.replaceChildren();
    labelsG.replaceChildren();
    shape.setAttribute("points", "");
    capText.textContent = "";
    return;
  }

  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);

  // Match your original constants
  const size = 520;
  const padding = 112;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - padding; // 148

  const maxVal = Math.max(1, ...values);
  const step = (Math.PI * 2) / labels.length;
  const start = -Math.PI / 2;

  const NS = "http://www.w3.org/2000/svg";

  const polar = (i, radius) => {
    const a = start + i * step;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  };

  const el = (name, attrs = {}, text) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (text != null) node.textContent = String(text);
    return node;
  };

  // Reset dynamic groups
  axesG.replaceChildren();
  dotsG.replaceChildren();
  labelsG.replaceChildren();

  // Build polygon points
  const pts = [];

  for (let i = 0; i < labels.length; i++) {
    const t = Math.max(0, Math.min(1, values[i] / maxVal));

    // Axis
    const [ax, ay] = polar(i, r);
    axesG.appendChild(
      el("line", {
        x1: cx.toFixed(2),
        y1: cy.toFixed(2),
        x2: ax.toFixed(2),
        y2: ay.toFixed(2),
        class: "radar-axis",
      })
    );

    // Dot + polygon point
    const [px, py] = polar(i, r * t);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);

    dotsG.appendChild(
      el("circle", {
        cx: px.toFixed(2),
        cy: py.toFixed(2),
        r: "3.2",
        class: "radar-dot",
      })
    );

    // Label
    const [lx, ly] = polar(i, r + 48);
    const anchor =
      Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
    const dy = ly > cy ? 16 : -8;

    labelsG.appendChild(
      el(
        "text",
        {
          x: lx.toFixed(2),
          y: (ly + dy).toFixed(2),
          "text-anchor": anchor,
          class: "radar-label",
        },
        labels[i]
      )
    );
  }

  shape.setAttribute("points", pts.join(" "));
  capText.textContent = `max ${Math.round(maxVal)}xp`;
};



export const renderXPGraph = (data) => {
  const el = document.getElementById("xp-graph");
  if (!el) return;

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) {
    el.innerHTML = "";
    return;
  }

  const pts = [];
  let running = 0;

  for (const r of rows) {
    const t = new Date(r.createdAt).getTime();
    if (!Number.isFinite(t)) continue;

    running += Number(r.amount) || 0;
    pts.push({ t, v: running / 1000 }); // KB
  }

  if (!pts.length) {
    el.innerHTML = "";
    return;
  }

  const w = 900;
  const h = 320;
  const m = { top: 18, right: 18, bottom: 22, left: 72 };

  const innerW = w - m.left - m.right;
  const innerH = h - m.top - m.bottom;

  const minT = pts[0].t;
  const maxT = pts[pts.length - 1].t || (minT + 1);

  const maxY = Math.max(0.001, ...pts.map(p => p.v));

  const xScale = (t) => m.left + ((t - minT) / (maxT - minT || 1)) * innerW;
  const yScale = (v) => m.top + (1 - (v / maxY)) * innerH;

  // step line (horizontal then vertical)
  const stepPath = (() => {
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      const x = xScale(pts[i].t);
      const y = yScale(pts[i].v);

      if (i === 0) {
        d += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
        continue;
      }

      const prevY = yScale(pts[i - 1].v);
      d += `L ${x.toFixed(2)} ${prevY.toFixed(2)} `;
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return d.trim();
  })();

  const stepArea = (() => {
    const x0 = xScale(pts[0].t);
    const yBase = yScale(0);

    let d = `M ${x0.toFixed(2)} ${yBase.toFixed(2)} `;
    d += `L ${x0.toFixed(2)} ${yScale(pts[0].v).toFixed(2)} `;

    for (let i = 1; i < pts.length; i++) {
      const x = xScale(pts[i].t);
      const prevY = yScale(pts[i - 1].v);
      const y = yScale(pts[i].v);
      d += `L ${x.toFixed(2)} ${prevY.toFixed(2)} `;
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }

    const xLast = xScale(pts[pts.length - 1].t);
    d += `L ${xLast.toFixed(2)} ${yBase.toFixed(2)} Z`;
    return d;
  })();

  const fmtTick = (ms) => {
    const d = new Date(ms);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  const xTicks = [0, 0.33, 0.66, 1].map(p => {
    const t = minT + (maxT - minT) * p;
    return { x: xScale(t), label: fmtTick(t) };
  });

  const yTicks = [0, 0.5, 1].map(p => {
    const v = Math.round(maxY * p);
    return { v, y: yScale(v), label: `${v} KB` };
  });

  const gridY = yTicks
    .map(t => `<line class="xp-grid" x1="${m.left}" y1="${t.y.toFixed(2)}" x2="${(w - m.right)}" y2="${t.y.toFixed(2)}" />`)
    .join("");

  const dots = pts
    .map((p, i) => {
      const x = xScale(p.t);
      const y = yScale(p.v);
      const rr = i === pts.length - 1 ? 4.6 : 3.6;
      return `<circle class="xp-dot" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rr}" />`;
    })
    .join("");

  const last = pts[pts.length - 1];
  const totalKB = Math.round(last.v);
  const gainedKB = Math.round(pts[pts.length - 1].v - pts[0].v);

  const lastX = xScale(last.t);
  const lastY = yScale(last.v);

  const labelX = Math.min(w - m.right, lastX + 8);
  const labelY = Math.max(m.top + 14, lastY - 12);

  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="XP over time (cumulative)">
      ${gridY}

      <path class="xp-area" d="${stepArea}"></path>
      <path class="xp-line" d="${stepPath}"></path>

      ${dots}

      ${yTicks.map(t => `
        <text class="xp-axis" x="${(m.left - 12)}" y="${(t.y + 4).toFixed(2)}" text-anchor="end">${t.label}</text>
      `).join("")}

      ${xTicks.map(t => `
        <text class="xp-axis" x="${t.x.toFixed(2)}" y="${(h - 8)}" text-anchor="middle">${t.label}</text>
      `).join("")}

      <text class="xp-label" x="${labelX.toFixed(2)-20}" y="${labelY.toFixed(2)}" text-anchor="end">~${totalKB} KB Total</text>
    </svg>
  `;
};
