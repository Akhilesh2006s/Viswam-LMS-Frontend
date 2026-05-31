(function () {
  async function fetchAbacusQuestionSet(category, levelName, mode) {
    const json = await AbacusAPI.fetch('/portal/questions/generate', {
      method: 'POST',
      body: JSON.stringify({
        category,
        level: levelName,
        mode: mode || 'practice',
        count: 25,
      }),
    });

    const data = json.data;
    localStorage.setItem('questionSetId', data.id);

    const problems = (data.questions || []).map((q) => ({
      numbers: q.numbers,
      ops: q.ops || [],
      total: q.total,
      type: q.type === 'standard' ? undefined : q.type,
    }));

    const answers = problems.map((p) => p.total);

    return {
      id: data.id,
      problems,
      answers,
    };
  }

  window.fetchAbacusQuestionSet = fetchAbacusQuestionSet;
})();
