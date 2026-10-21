(() => {
  const exam = window.EXAM;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    i: 0,
    answers: Array(exam.questions.length).fill(null),
    done: false
  };

  const letters = ["A", "B", "C", "D"];

  function show(id) {
    $$(".screen").forEach((el) => el.classList.toggle("active", el.id === id));
  }

  function renderTopics() {
    const labels = [...new Set(exam.questions.map((q) => q.topicLabel))];
    $("#topicCloud").innerHTML = labels.map((t) => `<span class="topic">${t}</span>`).join("");
  }

  function start() {
    state.i = 0;
    state.answers = Array(exam.questions.length).fill(null);
    state.done = false;
    show("screen-quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = exam.questions[state.i];
    const total = exam.questions.length;
    const pct = ((state.i) / total) * 100;
    $("#bar").style.width = `${((state.i + 1) / total) * 100}%`;
    $("#progText").textContent = `Pregunta ${state.i + 1} de ${total}`;
    $("#progPct").textContent = `${Math.round(((state.i + 1) / total) * 100)}%`;
    $("#qTopic").textContent = q.topicLabel;
    $("#qText").textContent = q.q;
    $("#options").innerHTML = q.options
      .map((opt, idx) => {
        const selected = state.answers[state.i] === idx ? " selected" : "";
        return `<button class="option${selected}" data-idx="${idx}" type="button">
          <span class="mark">${letters[idx]}</span>
          <span>${opt}</span>
        </button>`;
      })
      .join("");
    $$(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.answers[state.i] = Number(btn.dataset.idx);
        $$(".option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        $("#nextBtn").disabled = false;
      });
    });
    $("#prevBtn").disabled = state.i === 0;
    $("#nextBtn").textContent = state.i === total - 1 ? "Finalizar y corregir" : "Siguiente";
    $("#nextBtn").disabled = state.answers[state.i] === null;
    drawRing(((state.i + 1) / total) * 100);
  }

  function drawRing(pct) {
    const circ = 2 * Math.PI * 26;
    $("#ringArc").setAttribute("stroke-dasharray", `${circ}`);
    $("#ringArc").setAttribute("stroke-dashoffset", `${circ - (circ * pct) / 100}`);
    $("#ringLabel").textContent = `${state.i + 1}/${exam.questions.length}`;
  }

  function next() {
    if (state.answers[state.i] === null) return;
    if (state.i === exam.questions.length - 1) {
      finish();
      return;
    }
    state.i += 1;
    renderQuestion();
  }

  function prev() {
    if (state.i === 0) return;
    state.i -= 1;
    renderQuestion();
  }

  function scoreData() {
    const total = exam.questions.length;
    let correct = 0;
    const byTopic = {};
    exam.questions.forEach((q, i) => {
      const ok = state.answers[i] === q.answer;
      if (ok) correct += 1;
      if (!byTopic[q.topicLabel]) byTopic[q.topicLabel] = { ok: 0, n: 0 };
      byTopic[q.topicLabel].n += 1;
      if (ok) byTopic[q.topicLabel].ok += 1;
    });
    const note = Math.round((correct / total) * exam.scale * 10) / 10;
    return { total, correct, note, passed: note >= exam.passMark, byTopic };
  }

  function finish() {
    state.done = true;
    const s = scoreData();
    show("screen-result");
    $("#scoreNum").textContent = s.note.toString().replace(".", ",");
    $("#scoreNum").className = `score-num ${s.passed ? "pass" : "fail"}`;
    $("#badge").className = `badge ${s.passed ? "pass" : "fail"}`;
    $("#badge").textContent = s.passed ? "Aprobado" : "No aprobado";
    $("#resultSub").innerHTML = `${s.correct} de ${s.total} correctas.<br>
      Se aprueba con ${exam.passMark} sobre ${exam.scale}.`;
    $("#topicBreakdown").innerHTML = Object.entries(s.byTopic)
      .map(([label, v]) => {
        const p = Math.round((v.ok / v.n) * 100);
        const cls = p === 100 ? "strong" : p < 50 ? "weak" : "";
        return `<div class="topic-row ${cls}">
          <header><span>${label}</span><strong>${v.ok}/${v.n}</strong></header>
          <div class="mini"><i style="width:${p}%"></i></div>
        </div>`;
      })
      .join("");

    $("#review").innerHTML = exam.questions
      .map((q, i) => {
        const chosen = state.answers[i];
        const good = chosen === q.answer;
        return `<article>
          <div class="q-topic">${q.topicLabel} · ${good ? "Acertó" : "No acertó"}</div>
          <h3>${i + 1}. ${q.q}</h3>
          <div class="options">
            ${q.options
              .map((opt, idx) => {
                let cls = "option";
                if (idx === q.answer) cls += " ok";
                if (idx === chosen && !good) cls += " bad";
                return `<div class="${cls}"><span class="mark">${letters[idx]}</span><span>${opt}</span></div>`;
              })
              .join("")}
          </div>
          <p class="explain">${q.explain}</p>
        </article>`;
      })
      .join("");

    if (s.passed) burst();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function burst() {
    const box = $("#confetti");
    box.innerHTML = "";
    const colors = ["#ea7e24", "#fba76f", "#268ed9", "#1fa881", "#ffffff"];
    for (let i = 0; i < 70; i += 1) {
      const el = document.createElement("i");
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = `${2.4 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      box.appendChild(el);
    }
    setTimeout(() => { box.innerHTML = ""; }, 4500);
  }

  function reset() {
    state.i = 0;
    state.answers = Array(exam.questions.length).fill(null);
    state.done = false;
    show("screen-intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#qCount").textContent = String(exam.questions.length);
    $("#topicCount").textContent = String(new Set(exam.questions.map((q) => q.topic)).size);
    renderTopics();
    $("#startBtn").addEventListener("click", start);
    $("#nextBtn").addEventListener("click", next);
    $("#prevBtn").addEventListener("click", prev);
    $("#retryBtn").addEventListener("click", reset);
  });
})();
