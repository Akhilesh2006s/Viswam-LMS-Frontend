(function () {
  const student = JSON.parse(localStorage.getItem('student') || 'null');

  if (!student && !localStorage.getItem('authToken')) {
    window.location.href = '/auth/login';
  }

  const userRank = student?.rank || 1;

  async function loadCategories() {
    try {
      const json = await AbacusAPI.fetch('/portal/catalog');
      const categories = json.data.categories || [];
      const dropdown = document.getElementById('category');
      if (!dropdown) return;
      dropdown.innerHTML = '<option value="">Category</option>';
      categories.forEach((c) => {
        const op = document.createElement('option');
        op.value = c.category;
        op.text = c.category;
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
    const category = document.getElementById('category')?.value;
    const levelDropdown = document.getElementById('level');
    if (!levelDropdown) return;
    levelDropdown.innerHTML = '<option value="">Level</option>';
    if (!category) return;

    try {
      const json = await AbacusAPI.fetch('/portal/catalog');
      const cat = (json.data.categories || []).find((c) => c.category === category);
      if (!cat) return;
      cat.levels.forEach((l) => {
        const op = document.createElement('option');
        op.value = l.level_name;
        op.text = l.Dropdown_names || l.level_name;
        op.dataset.rank = String(l.rank);
        levelDropdown.appendChild(op);
      });
      if (student?.level && student?.category === category) {
        levelDropdown.value = student.level;
      }
    } catch (error) {
      console.error(error);
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

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('category')) loadCategories();
  });
  if (document.readyState !== 'loading' && document.getElementById('category')) {
    loadCategories();
  }
})();
