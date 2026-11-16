// =========================================================
// Lógica da Calculadora de Média e Faltas - IFPI Paulistana
// =========================================================

// DADOS INICIAIS DE EXEMPLO
const initialSubjects = [
  {
    id: '1',
    name: 'Português',
    workload: 80,
    absences: 4,
    n1: 8.0,
    n2: 7.5,
    n3: 8.5,
    n4: 8.0,
    finalExam: null
  },
  {
    id: '2',
    name: 'Matemática',
    workload: 80,
    absences: 12,
    n1: 6.5,
    n2: 7.0,
    n3: 5.5,
    n4: 6.0,
    finalExam: null
  },
  {
    id: '3',
    name: 'Introdução à Programação Web',
    workload: 80,
    absences: 6,
    n1: 9.0,
    n2: 8.5,
    n3: 9.5,
    n4: 9.0,
    finalExam: null
  },
  {
    id: '4',
    name: 'Algoritmos e Programação',
    workload: 100,
    absences: 10,
    n1: 7.0,
    n2: 6.0,
    n3: 8.0,
    n4: 7.5,
    finalExam: null
  }
];

let subjects = [];

// ESCAPE HTML PARA PREVENIR XSS AO RENDERIZAR NOMES DE DISCIPLINAS
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// VERIFICA SE UMA NOTA É VÁLIDA (INCLUINDO NOTA 0)
function hasValidGrade(val) {
  return val !== null && val !== undefined && val !== '' && !Number.isNaN(Number(val));
}

// GERENCIAMENTO DO LOCALSTORAGE
function initData() {
  const stored = localStorage.getItem('ifpi_paulistana_disciplinas_v2');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      subjects = Array.isArray(parsed) ? parsed : [...initialSubjects];
    } catch (e) {
      subjects = [...initialSubjects];
    }
  } else {
    subjects = [...initialSubjects];
    saveData();
  }
  renderSubjects();
  updateDashboard();
  initSimulationSubjectSelect();
}

function saveData() {
  localStorage.setItem('ifpi_paulistana_disciplinas_v2', JSON.stringify(subjects));
}

// CÁLCULO DE MÉDIAS, FALTAS E SITUAÇÃO DA DISCIPLINA
function calculateSubjectStats(sub) {
  const grades = [];
  if (hasValidGrade(sub.n1)) grades.push(Number(sub.n1));
  if (hasValidGrade(sub.n2)) grades.push(Number(sub.n2));
  if (hasValidGrade(sub.n3)) grades.push(Number(sub.n3));
  if (hasValidGrade(sub.n4)) grades.push(Number(sub.n4));

  let mediaRegular = 0;
  if (grades.length > 0) {
    const sum = grades.reduce((a, b) => a + b, 0);
    mediaRegular = sum / grades.length;
  }

  // Percentual de faltas
  const workload = Number(sub.workload) || 0;
  const absences = Number(sub.absences) || 0;
  const absencePercent = workload > 0 ? (absences / workload) * 100 : 0;
  const isFailedAbsence = absencePercent > 25;

  // Cálculo da média final (com exame final, se houver)
  let mediaFinal = mediaRegular;
  const hasFinalExam = hasValidGrade(sub.finalExam);
  if (hasFinalExam) {
    mediaFinal = (mediaRegular + Number(sub.finalExam)) / 2;
  }

  // Situação da disciplina
  let status = '';
  let statusClass = '';

  if (grades.length === 0 && !isFailedAbsence) {
    status = 'Cursando';
    statusClass = 'text-slate-700 bg-slate-100 border-slate-200';
  } else if (isFailedAbsence) {
    status = 'Reprovado por Faltas';
    statusClass = 'text-red-700 bg-red-100 border-red-200';
  } else if (mediaFinal >= 6.0) {
    status = 'Aprovado';
    statusClass = 'text-emerald-800 bg-emerald-100 border-emerald-200';
  } else if (mediaRegular >= 4.0) {
    if (hasFinalExam && mediaFinal < 6.0) {
      status = 'Reprovado no Exame Final';
      statusClass = 'text-red-700 bg-red-100 border-red-200';
    } else {
      status = 'Recuperação / Exame Final';
      statusClass = 'text-amber-800 bg-amber-100 border-amber-200';
    }
  } else {
    status = 'Reprovado por Média';
    statusClass = 'text-red-700 bg-red-100 border-red-200';
  }

  return {
    mediaRegular: mediaRegular.toFixed(1),
    mediaFinal: mediaFinal.toFixed(1),
    absencePercent: absencePercent.toFixed(1),
    isFailedAbsence,
    status,
    statusClass
  };
}

// ATUALIZAÇÃO DOS CARDS DO DASHBOARD SUPERIOR
function updateDashboard() {
  const totalCount = subjects.length;
  document.getElementById('dash-total').innerText = totalCount;

  if (totalCount === 0) {
    document.getElementById('dash-media').innerText = '0.0';
    document.getElementById('dash-freq').innerText = '100%';
    document.getElementById('dash-faltas').innerText = '0h';
    return;
  }

  let totalMediaSum = 0;
  let totalAbsencesHours = 0;
  let totalWorkloadHours = 0;

  subjects.forEach(sub => {
    const stats = calculateSubjectStats(sub);
    totalMediaSum += Number(stats.mediaFinal);
    totalAbsencesHours += Number(sub.absences) || 0;
    totalWorkloadHours += Number(sub.workload) || 0;
  });

  const avgMedia = (totalMediaSum / totalCount).toFixed(1);
  const rawFreq = totalWorkloadHours > 0
    ? ((totalWorkloadHours - totalAbsencesHours) / totalWorkloadHours) * 100
    : 100;
  const overallFreq = Math.max(0, Math.min(100, rawFreq)).toFixed(0);

  document.getElementById('dash-media').innerText = avgMedia;
  document.getElementById('dash-freq').innerText = `${overallFreq}%`;
  document.getElementById('dash-faltas').innerText = `${totalAbsencesHours}h`;
}

// RENDERIZAÇÃO DOS CARDS DE DISCIPLINAS
function renderSubjects() {
  const container = document.getElementById('subjects-container');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-state-title');
  const emptyDesc = document.getElementById('empty-state-desc');
  const emptyBtn = document.getElementById('empty-state-btn');
  const filter = document.getElementById('filter-status').value;

  container.innerHTML = '';

  const filteredSubjects = subjects.filter(sub => {
    const stats = calculateSubjectStats(sub);
    if (filter === 'todos') return true;
    if (filter === 'Aprovado') return stats.status === 'Aprovado';
    if (filter === 'Recuperação') return stats.status.includes('Recuperação');
    if (filter === 'Reprovado') return stats.status.includes('Reprovado');
    return true;
  });

  if (filteredSubjects.length === 0) {
    emptyState.classList.remove('hidden');
    if (subjects.length > 0 && filter !== 'todos') {
      emptyTitle.innerText = 'Nenhuma disciplina encontrada neste filtro';
      emptyDesc.innerText = 'Não há disciplinas com a situação selecionada. Tente mudar o filtro acima.';
      emptyBtn.classList.add('hidden');
    } else {
      emptyTitle.innerText = 'Nenhuma disciplina cadastrada';
      emptyDesc.innerText = 'Cadastre suas disciplinas do IFPI com as notas e controle suas faltas de forma simples.';
      emptyBtn.classList.remove('hidden');
    }
  } else {
    emptyState.classList.add('hidden');
  }

  filteredSubjects.forEach(sub => {
    const stats = calculateSubjectStats(sub);
    const safeName = escapeHTML(sub.name);
    const safeId = escapeHTML(sub.id);
    const maxAbsences = ((Number(sub.workload) || 0) * 0.25).toFixed(0);
    const barWidth = Math.min((Number(stats.absencePercent) / 25) * 100, 100);

    const cardHtml = `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between">
        <div>
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 leading-snug">${safeName}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-slate-500"><i class="fa-regular fa-clock"></i> ${sub.workload}h Totais</span>
                <span class="text-slate-300">•</span>
                <span class="text-xs ${stats.isFailedAbsence ? 'text-red-600 font-bold' : 'text-slate-500'}">
                  <i class="fa-solid fa-user-xmark"></i> ${sub.absences}h faltas (${stats.absencePercent}%)
                </span>
              </div>
            </div>

            <!-- Status Badge -->
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border ${stats.statusClass} whitespace-nowrap shadow-sm">
              ${stats.status}
            </span>
          </div>

          <!-- Grades Grid -->
          <div class="grid grid-cols-5 gap-1 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 my-4">
            <div>
              <span class="block text-[10px] uppercase font-bold text-slate-400">N1</span>
              <span class="text-xs font-extrabold ${hasValidGrade(sub.n1) ? 'text-slate-800' : 'text-slate-300'}">
                ${hasValidGrade(sub.n1) ? Number(sub.n1).toFixed(1) : '-'}
              </span>
            </div>
            <div>
              <span class="block text-[10px] uppercase font-bold text-slate-400">N2</span>
              <span class="text-xs font-extrabold ${hasValidGrade(sub.n2) ? 'text-slate-800' : 'text-slate-300'}">
                ${hasValidGrade(sub.n2) ? Number(sub.n2).toFixed(1) : '-'}
              </span>
            </div>
            <div>
              <span class="block text-[10px] uppercase font-bold text-slate-400">N3</span>
              <span class="text-xs font-extrabold ${hasValidGrade(sub.n3) ? 'text-slate-800' : 'text-slate-300'}">
                ${hasValidGrade(sub.n3) ? Number(sub.n3).toFixed(1) : '-'}
              </span>
            </div>
            <div>
              <span class="block text-[10px] uppercase font-bold text-slate-400">N4</span>
              <span class="text-xs font-extrabold ${hasValidGrade(sub.n4) ? 'text-slate-800' : 'text-slate-300'}">
                ${hasValidGrade(sub.n4) ? Number(sub.n4).toFixed(1) : '-'}
              </span>
            </div>
            <div class="border-l border-slate-200">
              <span class="block text-[10px] uppercase font-bold text-emerald-700">Média</span>
              <span class="text-xs font-black text-emerald-700">
                ${stats.mediaFinal}
              </span>
            </div>
          </div>

          ${hasValidGrade(sub.finalExam) ? `
            <div class="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs flex justify-between items-center text-amber-900">
              <span><i class="fa-solid fa-pen-to-square"></i> Exame Final:</span>
              <span class="font-extrabold">${Number(sub.finalExam).toFixed(1)}</span>
            </div>
          ` : ''}

          <!-- Progress Bar Absences -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-500">Limite de Faltas (Máx 25%)</span>
              <span class="${stats.isFailedAbsence ? 'text-red-600 font-bold' : 'text-slate-600'}">
                ${sub.absences} / ${maxAbsences}h max
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="h-full transition-all ${stats.isFailedAbsence ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${barWidth}%"></div>
            </div>
          </div>
        </div>

        <!-- Card Actions Footer -->
        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
          <button type="button" data-action="edit" data-id="${safeId}" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all flex items-center gap-1">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button type="button" data-action="delete" data-id="${safeId}" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all flex items-center gap-1">
            <i class="fa-solid fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
    container.innerHTML += cardHtml;
  });
}

// CONTROLE DO MODAL (ABRIR, FECHAR, EDITAR, SALVAR, EXCLUIR)
function openModal() {
  document.getElementById('modal-title-text').innerText = 'Nova Disciplina';
  document.getElementById('modal-id').value = '';
  document.getElementById('subject-form').reset();
  document.getElementById('subject-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('subject-modal').classList.add('hidden');
}

function editSubject(id) {
  const sub = subjects.find(s => s.id === id);
  if (!sub) return;

  document.getElementById('modal-title-text').innerText = 'Editar Disciplina';
  document.getElementById('modal-id').value = sub.id;
  document.getElementById('modal-name').value = sub.name;
  document.getElementById('modal-workload').value = sub.workload;
  document.getElementById('modal-absences').value = sub.absences;
  document.getElementById('modal-n1').value = hasValidGrade(sub.n1) ? sub.n1 : '';
  document.getElementById('modal-n2').value = hasValidGrade(sub.n2) ? sub.n2 : '';
  document.getElementById('modal-n3').value = hasValidGrade(sub.n3) ? sub.n3 : '';
  document.getElementById('modal-n4').value = hasValidGrade(sub.n4) ? sub.n4 : '';
  document.getElementById('modal-final').value = hasValidGrade(sub.finalExam) ? sub.finalExam : '';

  document.getElementById('subject-modal').classList.remove('hidden');
}

function saveSubject(e) {
  e.preventDefault();

  const id = document.getElementById('modal-id').value;
  const name = document.getElementById('modal-name').value.trim();
  const workload = Number(document.getElementById('modal-workload').value);
  const absences = Number(document.getElementById('modal-absences').value);

  const n1Val = document.getElementById('modal-n1').value;
  const n2Val = document.getElementById('modal-n2').value;
  const n3Val = document.getElementById('modal-n3').value;
  const n4Val = document.getElementById('modal-n4').value;
  const finalVal = document.getElementById('modal-final').value;

  const n1 = n1Val !== '' ? Number(n1Val) : null;
  const n2 = n2Val !== '' ? Number(n2Val) : null;
  const n3 = n3Val !== '' ? Number(n3Val) : null;
  const n4 = n4Val !== '' ? Number(n4Val) : null;
  const finalExam = finalVal !== '' ? Number(finalVal) : null;

  if (id) {
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      subjects[index] = { id, name, workload, absences, n1, n2, n3, n4, finalExam };
    }
  } else {
    const newSub = {
      id: Date.now().toString(),
      name,
      workload,
      absences,
      n1,
      n2,
      n3,
      n4,
      finalExam
    };
    subjects.push(newSub);
  }

  saveData();
  renderSubjects();
  updateDashboard();
  initSimulationSubjectSelect();
  closeModal();
}

function deleteSubject(id) {
  if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
    subjects = subjects.filter(s => s.id !== id);
    saveData();
    renderSubjects();
    updateDashboard();
    initSimulationSubjectSelect();
  }
}

// SIMULADOR DE NOTAS
function updateSliderValue(val) {
  document.getElementById('sim-slider-val').innerText = parseFloat(val).toFixed(1);
  calculateSimulation();
}

function initSimulationSubjectSelect() {
  const select = document.getElementById('sim-subject-select');
  const previousValue = select.value;
  select.innerHTML = '<option value="">-- Seleção Manual / Livre --</option>';

  subjects.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });

  if (previousValue && subjects.some(s => s.id === previousValue)) {
    select.value = previousValue;
    loadSimSubjectData();
  } else if (subjects.length > 0) {
    select.value = subjects[0].id;
    loadSimSubjectData();
  } else {
    calculateSimulation();
  }
}

function loadSimSubjectData() {
  const select = document.getElementById('sim-subject-select');
  const id = select.value;
  const sub = subjects.find(s => s.id === id);

  if (sub) {
    document.getElementById('sim-n1').value = hasValidGrade(sub.n1) ? sub.n1 : 0;
    document.getElementById('sim-n2').value = hasValidGrade(sub.n2) ? sub.n2 : 0;
    document.getElementById('sim-n3').value = hasValidGrade(sub.n3) ? sub.n3 : 0;
    document.getElementById('sim-n4').value = hasValidGrade(sub.n4) ? sub.n4 : '';
  } else {
    document.getElementById('sim-n1').value = 0;
    document.getElementById('sim-n2').value = 0;
    document.getElementById('sim-n3').value = 0;
    document.getElementById('sim-n4').value = '';
  }

  calculateSimulation();
}

function calculateSimulation() {
  const n1 = parseFloat(document.getElementById('sim-n1').value) || 0;
  const n2 = parseFloat(document.getElementById('sim-n2').value) || 0;
  const n3 = parseFloat(document.getElementById('sim-n3').value) || 0;
  const n4Input = document.getElementById('sim-n4').value;
  const mode = document.getElementById('sim-mode').value;

  const targetMediaRadio = document.querySelector('input[name="target-media"]:checked');
  const targetMedia = parseFloat(targetMediaRadio ? targetMediaRadio.value : 6.0);
  const sliderTarget = parseFloat(document.getElementById('sim-slider').value) || 0;

  let requiredScore = 0;
  let projectedMedia = 0;
  let statusBadge = '';
  let resultText = '';

  if (mode === 'next_test') {
    const sum3 = n1 + n2 + n3;
    requiredScore = (4 * targetMedia) - sum3;
    projectedMedia = (sum3 + sliderTarget) / 4;

    if (requiredScore <= 0) {
      requiredScore = 0;
      statusBadge = 'Já Aprovado!';
      resultText = `Você já atingiu a média ${targetMedia.toFixed(1)} acumulando ${sum3.toFixed(1)} pontos nas três primeiras avaliações!`;
    } else if (requiredScore > 10) {
      statusBadge = 'Exame Final Necessário';
      resultText = `Mesmo se tirar 10.0 na N4, você precisará fazer o Exame Final/Recuperação. Nota N4 exata seria: ${requiredScore.toFixed(1)}.`;
    } else {
      statusBadge = 'Alcançável na N4';
      resultText = `Você precisa obter no mínimo ${requiredScore.toFixed(1)} na Avaliação 4 (N4) para fechar o período com média ${targetMedia.toFixed(1)}.`;
    }
  } else {
    const n4 = parseFloat(n4Input) || 0;
    const currentMediaRegular = (n1 + n2 + n3 + n4) / 4;
    requiredScore = 12.0 - currentMediaRegular;
    projectedMedia = (currentMediaRegular + sliderTarget) / 2;

    if (currentMediaRegular >= 6.0) {
      requiredScore = 0;
      statusBadge = 'Sem Necessidade de Exame';
      resultText = `Sua média parcial (${currentMediaRegular.toFixed(1)}) já é suficiente para aprovação sem exame final.`;
    } else if (currentMediaRegular < 4.0) {
      statusBadge = 'Sem Direito a Exame';
      resultText = `Sua média regular (${currentMediaRegular.toFixed(1)}) é inferior a 4.0, não atingindo o mínimo para realizar o Exame Final.`;
    } else if (requiredScore > 10) {
      statusBadge = 'Situação Crítica';
      resultText = `A nota necessária no Exame Final seria ${requiredScore.toFixed(1)}, o que ultrapassa o limite máximo de 10.0 da prova.`;
    } else {
      statusBadge = 'Recuperação Viável';
      resultText = `Com sua média regular igual a ${currentMediaRegular.toFixed(1)}, você precisa tirar no mínimo ${requiredScore.toFixed(1)} no Exame Final.`;
    }
  }

  document.getElementById('sim-required-score').innerText = requiredScore.toFixed(1);
  document.getElementById('sim-projected-media').innerText = projectedMedia.toFixed(1);
  document.getElementById('sim-status-badge').innerText = statusBadge;
  document.getElementById('sim-result-text').innerText = resultText;
}

// INICIALIZAÇÃO E REGISTRO DE EVENTOS AO CARREGAR A PÁGINA
window.addEventListener('DOMContentLoaded', () => {
  initData();

  // Botões de abrir e fechar modal
  document.getElementById('btn-open-modal').addEventListener('click', openModal);
  document.getElementById('empty-state-btn').addEventListener('click', openModal);
  document.getElementById('btn-close-modal-top').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

  // Formulário de salvar disciplina
  document.getElementById('subject-form').addEventListener('submit', saveSubject);

  // Filtro de situação
  document.getElementById('filter-status').addEventListener('change', renderSubjects);

  // Delegação de eventos nos botões Editar e Excluir dos cards
  document.getElementById('subjects-container').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'edit') editSubject(id);
    if (action === 'delete') deleteSubject(id);
  });

  // Eventos do simulador de notas
  document.getElementById('sim-subject-select').addEventListener('change', loadSimSubjectData);
  document.getElementById('sim-n1').addEventListener('input', calculateSimulation);
  document.getElementById('sim-n2').addEventListener('input', calculateSimulation);
  document.getElementById('sim-n3').addEventListener('input', calculateSimulation);
  document.getElementById('sim-n4').addEventListener('input', calculateSimulation);
  document.getElementById('sim-mode').addEventListener('change', calculateSimulation);
  document.getElementById('sim-slider').addEventListener('input', (e) => updateSliderValue(e.target.value));

  document.querySelectorAll('input[name="target-media"]').forEach((radio) => {
    radio.addEventListener('change', calculateSimulation);
  });

  // Fecha o modal ao clicar fora da caixa branca ou pressionar ESC
  const modal = document.getElementById('subject-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });
});
