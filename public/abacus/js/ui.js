(function () {
  const student = JSON.parse(localStorage.getItem('student') || 'null');

  if (!student && !localStorage.getItem('authToken')) {
    window.location.href = '/auth/login';
  }

  const userRank = student?.rank || 1;
  let categoryLoadSeq = 0;
  let levelLoadSeq = 0;
  let autoInitDone = false;
  let levelsInflight = null;

  function uniqueLevels(levels) {
    const seen = new Set();
    const out = [];
    (levels || []).forEach((l) => {
      const name = l?.level_name;
      if (!name || seen.has(name)) return;
      seen.add(name);
      out.push(l);
    });
    return out;
  }

  function fillLevelDropdown(levelDropdown, levels, selectedLevel) {
    levelDropdown.innerHTML = '<option value="">Level</option>';
    uniqueLevels(levels).forEach((l) => {
      const op = document.createElement('option');
      op.value = l.level_name;
      op.textContent = l.Dropdown_names || l.level_name;
      op.dataset.rank = String(l.rank);
      levelDropdown.appendChild(op);
    });
    if (selectedLevel) levelDropdown.value = selectedLevel;
  }

  async function loadCategories() {
    const seq = ++categoryLoadSeq;
    const dropdown = document.getElementById('category');
    if (!dropdown) return;
    try {
      const json = await AbacusAPI.fetch('/portal/catalog');
      if (seq !== categoryLoadSeq) return;
      const categories = json.data.categories || [];
      dropdown.innerHTML = '<option value="">Category</option>';
      categories.forEach((c) => {
        const op = document.createElement('option');
        op.value = c.category;
        op.textContent = c.category;
        dropdown.appendChild(op);
      });
      if (student?.category) {
        dropdown.value = student.category;
        await updateLevels();
      }
    } catch (error) {
      console.error('Category fetch error:', error);
    }
  }

  async function updateLevels() {
    if (levelsInflight) return levelsInflight;
    levelsInflight = (async () => {
      const category = document.getElementById('category')?.value;
      const levelDropdown = document.getElementById('level');
      if (!levelDropdown) return;
      const seq = ++levelLoadSeq;
      if (!category) {
        levelDropdown.replaceChildren();
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = 'Level';
        levelDropdown.appendChild(ph);
        return;
      }

      try {
        const json = await AbacusAPI.fetch('/portal/catalog');
        if (seq !== levelLoadSeq) return;
        const cat = (json.data.categories || []).find((c) => c.category === category);
        if (!cat) return;
        const selected =
          student?.level && student?.category === category ? student.level : '';
        fillLevelDropdown(levelDropdown, cat.levels, selected);
      } catch (error) {
        console.error(error);
      }
    })();
    try {
      await levelsInflight;
    } finally {
      levelsInflight = null;
    }
  }

  function checkAnswers() {
    const inputs = document.querySelectorAll('.answer');
    const results = document.querySelectorAll('.result');
    inputs.forEach((i, index) => {
      const v = i.value.trim();
      if (v === '') {
        results[index].innerHTML = '';
        return;
      }
      if (parseInt(v, 10) === answers[index]) {
        results[index].innerHTML = '✔';
        results[index].className = 'result correct';
      } else {
        results[index].innerHTML = '✘';
        results[index].className = 'result wrong';
      }
    });
  }

  function resetAnswers() {
    document.querySelectorAll('.answer').forEach((i) => {
      i.value = '';
    });
    document.querySelectorAll('.result').forEach((i) => {
      i.innerHTML = '';
    });
  }

  function saveCategory() {
    const cat = document.getElementById('category')?.value;
    if (cat) localStorage.setItem('category', cat);
  }

  function saveLevel() {
    const lvl = document.getElementById('level')?.value;
    const opt = document.getElementById('level')?.selectedOptions?.[0];
    if (lvl) localStorage.setItem('level', lvl);
    if (opt?.dataset?.rank) localStorage.setItem('levelRank', opt.dataset.rank);
    if (opt?.text) localStorage.setItem('levelName', opt.text);
  }

  window.loadCategories = loadCategories;
  window.updateLevels = updateLevels;
  window.checkAnswers = checkAnswers;
  window.resetAnswers = resetAnswers;
  window.saveCategory = saveCategory;
  window.saveLevel = saveLevel;

  function maybeAutoInit() {
    if (window.__ABACUS_SPA) return;
    if (autoInitDone || !document.getElementById('category')) return;
    autoInitDone = true;
    void loadCategories();
  }

  document.addEventListener('DOMContentLoaded', maybeAutoInit);
  if (document.readyState !== 'loading') maybeAutoInit();
})();
