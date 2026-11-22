"use strict";

const main = document.querySelector("#main");
const search = document.querySelector("#query");
const storageKey = "linal-solved-v1";
const topicMap = new Map(topics.map(topic => [topic.id, topic]));
const formulaMap = new Map(formulas.map(formula => [formula.id, formula]));
const algorithmMap = new Map(algorithms.map(algorithm => [algorithm.id, algorithm]));
const sections = ["theory","formulas","algorithms","practice"];
const filters = { formulas:"all", algorithms:"all", practice:"all" };
let practiceMode = "list";
let randomTask = null;
let solved = new Set();

try {
  const ids = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(ids)) solved = new Set(ids.filter(id => tasks.some(task => task.id === id)));
} catch {}

function escapeHTML(value) {
  const entities = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

function readable(value) {
  return escapeHTML(value).replace(/\[\[[^\[\]]+\](?:,\[[^\[\]]+\])*\]/g, matrix => {
    const rows = Array.from(matrix.matchAll(/\[([^\[\]]+)\]/g), match =>
      '<mtr>' + match[1].split(",").map(cell => '<mtd><mtext>' + cell + '</mtext></mtd>').join("") + '</mtr>');
    return '<math><mrow><mo>(</mo><mtable rowspacing=".15em" columnspacing=".6em">'
      + rows.join("") + '</mtable><mo>)</mo></mrow></math>';
  });
}

function heading(title, body = "") {
  return '<div class="page-title"><h1>' + escapeHTML(title) + '</h1>'
    + (body ? '<p class="lead">' + escapeHTML(body) + '</p>' : "") + '</div>';
}

function topicList(active) {
  return '<div class="topic-list">' + topics.map((topic, index) =>
    '<a class="topic-row" href="#topic/' + topic.id + '"' + (active === topic.id ? ' aria-current="page"' : '') + '>'
      + '<span class="topic-number">' + (index + 1) + '</span><span><strong>' + escapeHTML(topic.title)
      + '</strong><small>' + escapeHTML(topic.lead) + '</small></span><span class="arrow" aria-hidden="true">→</span></a>'
  ).join("") + '</div>';
}

function home() {
  return `<section class="hero">
    <div><p class="eyebrow">Курс ВАВТ</p><h1>Линейная алгебра</h1><p class="lead">Конспекты лекций, формулы, алгоритмы решения и задачи для практики.</p></div>
    <div class="hero-equation"><span>Ax = λx</span><small>Собственные значения и векторы</small></div>
  </section>
  <div class="shortcuts">
    <a class="card" href="#formulas"><h3>Формулы <span class="arrow" aria-hidden="true">→</span></h3><p>Правила с примерами (${formulas.length})</p></a>
    <a class="card" href="#algorithms"><h3>Алгоритмы <span class="arrow" aria-hidden="true">→</span></h3><p>Решения по шагам (${algorithms.length})</p></a>
    <a class="card" href="#practice"><h3>Тренажёр <span class="arrow" aria-hidden="true">→</span></h3><p>Задачи с подсказками и проверкой (${tasks.length})</p></a>
  </div>
  <section class="contents"><h2>Темы курса</h2>${topicList()}</section>`;
}

function formulaCard(item) {
  const method = algorithms.find(algorithm => algorithm.topic === item.topic && algorithm.formulaIds.includes(item.id));
  return `<article class="card" id="formula-${item.id}">
    <h3>${escapeHTML(item.title)}</h3>
    <div class="formula math-scroll">${readable(item.formula)}</div>
    <p>${readable(item.rule)}</p>
    <p class="formula-example"><strong>Пример.</strong> ${readable(item.example)}</p>
    ${method ? `<p><a class="text-link" href="#algorithm/${method.id}">Посмотреть решение по шагам</a></p>` : ""}
  </article>`;
}

function topicPage(topic) {
  const index = topics.indexOf(topic);
  const topicFormulas = formulas.filter(item => item.topic === topic.id);
  const topicAlgorithms = algorithms.filter(item => item.topic === topic.id);
  const topicTasks = tasks.filter(task => task.topic === topic.id);
  return `<div class="crumbs"><a class="text-link" href="#theory">Теория</a> / ${escapeHTML(topic.source)}</div>
    <div class="reader-layout">
      <article class="reader">
        <p class="eyebrow">${escapeHTML(topic.source)} · ${escapeHTML(topic.pages)}</p>
        <h1>${escapeHTML(topic.title)}</h1>
        <p class="lead">${escapeHTML(topic.lead)}</p>
        ${topic.sections.map(([title,body,example]) => `<section><h2>${escapeHTML(title)}</h2><div class="math-scroll">${readable(body)}</div><p class="formula math-scroll"><strong>Пример.</strong> ${readable(example)}</p></section>`).join("")}
        <div class="task-actions">
          <a class="button" href="#formulas/${topic.id}">Формулы темы (${topicFormulas.length})</a>
          <a class="button" href="#algorithms/${topic.id}">Алгоритмы темы (${topicAlgorithms.length})</a>
          <a class="button primary" href="#practice/${topic.id}">Решить задачи (${topicTasks.length})</a>
        </div>
        <div class="task-actions">
          ${index > 0 ? '<a class="text-link" href="#topic/' + topics[index-1].id + '">← Предыдущая тема</a>' : ""}
          ${index + 1 < topics.length ? '<a class="text-link" href="#topic/' + topics[index+1].id + '">Следующая тема →</a>' : ""}
        </div>
      </article>
      <aside class="side" aria-label="Оглавление">${topicList(topic.id)}</aside>
    </div>`;
}

function filterControl(view) {
  return `<label>Тема <select id="topic-filter" data-view="${view}"><option value="all">Все темы</option>
  ${topics.map(topic => `<option value="${topic.id}" ${filters[view] === topic.id ? "selected" : ""}>${escapeHTML(topic.title)}</option>`).join("")}</select></label>`;
}

function formulaPage() {
  const list = formulas.filter(item => filters.formulas === "all" || item.topic === filters.formulas);
  return heading("Формулы", "К каждому правилу есть пример с числами.")
    + '<div class="controls">' + filterControl("formulas") + '</div><div class="formula-grid">' + list.map(formulaCard).join("") + '</div>';
}

function algorithmsPage() {
  const list = algorithms.filter(item => filters.algorithms === "all" || item.topic === filters.algorithms);
  const ticket = filters.algorithms === "all" ? `<section class="card ticket-links">
    <h2>Билет №19</h2>
    <ul>
      <li><a class="text-link" href="#algorithm/choose-basis">1. Ранг, базис и разложение</a></li>
      <li><a class="text-link" href="#algorithm/eigenvectors">2. Собственные значения и векторы</a></li>
      <li><a class="text-link" href="#algorithm/lagrange-squares">3а. Метод Лагранжа</a></li>
      <li><a class="text-link" href="#algorithm/apply-sylvester">3б. Критерий Сильвестра</a></li>
    </ul>
  </section>` : "";
  return heading("Алгоритмы", "В каждом разборе есть порядок действий, промежуточные вычисления и проверка.")
    + ticket
    + '<div class="controls">' + filterControl("algorithms") + '</div>'
    + '<div class="results-grid">' + list.map(item => `
      <a class="card" href="#algorithm/${item.id}">
        <p class="algorithm-topic">${escapeHTML(topicMap.get(item.topic).title)}</p>
        <h3>${escapeHTML(item.title)} <span class="arrow" aria-hidden="true">→</span></h3>
        <p>${escapeHTML(item.when)}</p>
      </a>`).join("") + '</div>';
}

function workedSteps(steps) {
  return `<ol class="algorithm-steps">${steps.map(([action, ...lines]) => `
    <li>
      <strong>${readable(action)}</strong>
      ${lines.map(line => `<p class="math-scroll">${readable(line)}</p>`).join("")}
    </li>`).join("")}</ol>`;
}

function complexPlot(points) {
  return `<figure class="complex-figure">
    <div class="complex-plot" aria-hidden="true">
      <span class="axis-label real-axis">Re</span><span class="axis-label imaginary-axis">Im</span>
      <span class="unit-circle"></span><span class="axis-label origin">0</span>
      ${points.map(([label, x, y]) => `<span class="complex-point" style="left:${50+32*x}%;top:${50-32*y}%"><span>${escapeHTML(label)}</span></span>`).join("")}
    </div>
    <figcaption>Координаты на комплексной плоскости: ${points.map(([label, , , coordinates]) =>
      `${escapeHTML(label)} ${escapeHTML(coordinates)}`).join(", ")}.</figcaption>
  </figure>`;
}

function algorithmPage(item) {
  const task = tasks.find(task => task.id === item.taskId);
  return `<div class="crumbs"><a class="text-link" href="#algorithms/${item.topic}">← Алгоритмы темы</a></div>
    <article class="reader algorithm-reader">
      <p class="eyebrow">${escapeHTML(topicMap.get(item.topic).title)}</p>
      <h1>${escapeHTML(item.title)}</h1>
      <p class="lead">${escapeHTML(item.when)}</p>
      <div class="formula math-scroll"><strong>Пример.</strong> ${readable(item.example)}</div>
      ${item.source ? `<p class="task-meta">${escapeHTML(item.source)}</p>` : ""}
      ${workedSteps(item.steps)}
      ${item.points ? complexPlot(item.points) : ""}
      <p class="note">${readable(item.check)}</p>
      <h2>Формулы</h2>
      <ul class="related-formulas">${item.formulaIds.map(id => {
        const formula = formulaMap.get(id);
        return `<li><a class="text-link" href="#formula/${id}">${escapeHTML(formula.title)}</a></li>`;
      }).join("")}</ul>
      <div class="task-actions"><a class="button primary" href="#task/${task.id}">К задаче «${escapeHTML(task.title)}»</a></div>
    </article>`;
}

function taskCard(task) {
  const id = escapeHTML(task.id);
  const method = algorithmMap.get(task.workedBy);
  const solution = method ? workedSteps(method.steps)
    : `<ol>${task.steps.map(step => `<li class="math-scroll">${readable(step)}</li>`).join("")}</ol>`;
  const field = Array.isArray(task.check)
    ? '<select name="answer" aria-label="Ответ" required><option value="" selected disabled>Выбери ответ</option>'
      + task.check.map(choice => '<option>' + escapeHTML(choice) + '</option>').join("") + '</select>'
    : '<input name="answer" type="text" placeholder="Например: −3 или 1/2" aria-label="Ответ" autocomplete="off" required>';
  return `<article class="task" id="task-${id}">
    <p class="task-meta">${escapeHTML(task.source)} · <a class="text-link" href="#topic/${task.topic}">${escapeHTML(topicMap.get(task.topic).title)}</a></p>
    <h2>${escapeHTML(task.title)}</h2>
    <span class="pill solved" data-solved="${id}" ${solved.has(task.id) ? "" : "hidden"}>Решено</span>
    <p class="math-scroll">${readable(task.prompt)}</p>
    <form data-task="${id}">${field}<button class="button primary">Проверить</button></form>
    <p class="feedback" role="status"></p>
    <details><summary>Подсказка</summary><p class="math-scroll">${readable(task.hint)}</p></details>
    <details><summary>Решение по шагам</summary>${solution}<p class="math-scroll"><strong>Ответ.</strong> ${readable(task.answer)}</p></details>
    ${method ? `<a class="text-link" href="#algorithm/${method.id}">Алгоритм и формулы</a>` : ""}
  </article>`;
}

function filteredTasks() {
  return tasks.filter(task => filters.practice === "all" || task.topic === filters.practice);
}

function practicePage() {
  const list = filteredTasks();
  const completed = list.filter(task => solved.has(task.id)).length;
  const card = list.find(task => task.id === randomTask);
  return heading("Тренажёр", "Решай задачи по темам в своём темпе. Начни самостоятельно и открой подсказку, когда она понадобится.")
    + `<div class="controls">${filterControl("practice")}
      <button class="button" id="mix">${practiceMode === "random" ? "Следующая случайная" : "Случайная задача"}</button>
      ${practiceMode === "random" ? '<button class="button" id="all-tasks">К списку задач</button>' : ""}
    </div>
    <p class="muted" id="progress" role="status">Решено ${completed} из ${list.length}</p>
    <div class="task-list">${(practiceMode === "random" && card ? [card] : list).map(taskCard).join("")}</div>`;
}

function normalize(value) {
  return String(value).toLocaleLowerCase("ru").replaceAll("ё","е").replace(/[^\p{L}\p{N}]+/gu," ").trim();
}

function searchPage(query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const source = [
    ...topics.map(topic => [topic.title,topic.lead,"Теория","topic/" + topic.id,topic.sections.flat().join(" ")]),
    ...formulas.map(item => [item.title,item.formula,"Формула","formula/" + item.id,item.rule + " " + item.example]),
    ...algorithms.map(item => [item.title,item.when,"Алгоритм","algorithm/" + item.id,[item.source,item.example,item.check,...item.steps.flat()].join(" ")]),
    ...tasks.map(task => [task.title,task.prompt,"Задача","task/" + task.id,task.source])
  ];
  const results = tokens.length ? source.filter(([title,body,kind,route,extra]) =>
    tokens.every(token => normalize(title + " " + body + " " + extra).includes(token))
  ) : [];
  return heading("Поиск", query ? "«" + query + "» · найдено " + results.length : "Введи название темы, формулы, алгоритма или задачи.")
    + (results.length ? '<div class="results-grid">' + results.map(([title,body,kind,route]) =>
      `<a class="card" href="#${route}"><span class="pill">${kind}</span><h3>${escapeHTML(title)}</h3><p>${readable(body)}</p></a>`
    ).join("") + '</div>' : '<p>Попробуй «Гаусс», «ранг» или «сопряжённое».</p>');
}

function route() {
  const [view, ...parts] = location.hash.slice(1).split("/");
  let id = parts.join("/");
  try { id = decodeURIComponent(id); } catch {}
  const parentSection = { topic:"theory", task:"practice", formula:"formulas", algorithm:"algorithms" };
  const nav = parentSection[view] || view;
  for (const item of document.querySelectorAll(".top nav a")) {
    if (sections.includes(nav) && item.hash === "#" + nav) item.setAttribute("aria-current","page");
    else item.removeAttribute("aria-current");
  }
  if (view === "theory") main.innerHTML = heading("Теория", "Семь лекций по линейной алгебре, семинары и пределы последовательностей.") + topicList();
  else if (view === "topic" && topicMap.has(id)) main.innerHTML = topicPage(topicMap.get(id));
  else if (view === "formulas") {
    filters.formulas = topicMap.has(id) ? id : "all";
    main.innerHTML = formulaPage();
  } else if (view === "algorithms") {
    filters.algorithms = topicMap.has(id) ? id : "all";
    main.innerHTML = algorithmsPage();
  } else if (view === "algorithm" && algorithmMap.has(id)) {
    main.innerHTML = algorithmPage(algorithmMap.get(id));
  } else if (view === "practice") {
    filters.practice = topicMap.has(id) ? id : "all";
    practiceMode = "list";
    main.innerHTML = practicePage();
  } else if (view === "task" && tasks.some(item => item.id === id)) {
    const task = tasks.find(item => item.id === id);
    main.innerHTML = '<div class="crumbs"><a class="text-link" href="#practice/' + task.topic + '">← Задачи темы</a></div>' + taskCard(task);
  } else if (view === "formula" && formulaMap.has(id)) {
    const item = formulaMap.get(id);
    main.innerHTML = '<div class="crumbs"><a class="text-link" href="#formulas/' + item.topic + '">← Формулы темы</a></div>' + formulaCard(item);
  } else if (view === "search") {
    search.value = id;
    main.innerHTML = searchPage(id);
  } else main.innerHTML = home();
}

function numericAnswer(value) {
  const clean = value.trim().replaceAll("−","-").replaceAll(",","." ).replace(/°$/,"").trim();
  const fraction = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean) ? Number(clean) : NaN;
}

document.querySelector("#search").addEventListener("submit", event => {
  event.preventDefault();
  const query = search.value.trim();
  location.hash = "#search/" + encodeURIComponent(query);
});

main.addEventListener("change", event => {
  if (event.target.id !== "topic-filter") return;
  const view = event.target.dataset.view;
  location.hash = "#" + view + (event.target.value === "all" ? "" : "/" + event.target.value);
});

main.addEventListener("click", event => {
  if (event.target.id === "mix") {
    const list = filteredTasks();
    const remaining = list.filter(task => !solved.has(task.id) && task.id !== randomTask);
    const alternatives = list.filter(task => task.id !== randomTask);
    const pool = remaining.length ? remaining : alternatives.length ? alternatives : list;
    randomTask = pool[Math.floor(Math.random() * pool.length)].id;
    practiceMode = "random";
    main.innerHTML = practicePage();
    document.querySelector("#mix").focus();
  } else if (event.target.id === "all-tasks") {
    practiceMode = "list";
    main.innerHTML = practicePage();
    document.querySelector("#mix").focus();
  }
});

main.addEventListener("submit", event => {
  const form = event.target;
  if (!form.dataset.task) return;
  event.preventDefault();
  const task = tasks.find(item => item.id === form.dataset.task);
  const feedback = form.nextElementSibling;
  const value = form.elements.answer.value;
  const number = Array.isArray(task.check) ? null : numericAnswer(value);
  if (number !== null && !Number.isFinite(number)) {
    feedback.className = "feedback bad";
    feedback.textContent = "Введи число или дробь, например −3 или 1/2.";
    return;
  }
  const correct = number === null ? value === task.answer : Math.abs(number-task.check) <= 1e-8;
  feedback.className = correct ? "feedback good" : "feedback bad";
  feedback.textContent = correct ? "Верно." : "Пока не сходится. Проверь вычисления или открой подсказку.";
  if (!correct) return;
  solved.add(task.id);
  try { localStorage.setItem(storageKey, JSON.stringify([...solved])); } catch {}
  document.querySelector('[data-solved="' + task.id + '"]').hidden = false;
  const progress = document.querySelector("#progress");
  if (progress) {
    const list = filteredTasks();
    progress.textContent = "Решено " + list.filter(item => solved.has(item.id)).length + " из " + list.length;
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey
      && !event.target.closest("input, textarea, select, [contenteditable]")) {
    event.preventDefault();
    search.focus();
  }
});

window.addEventListener("hashchange", () => {
  if (location.hash === "#main") return;
  route();
  window.scrollTo(0,0);
  main.focus({preventScroll:true});
});
route();
