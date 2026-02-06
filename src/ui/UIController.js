export default class UIController {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.moleculesEl = document.getElementById('molecules');
    this.qualityEl = document.getElementById('quality');
    this.selectedEl = document.getElementById('selected-atom');
    this.valenceEl = document.getElementById('valence-status');
    this.bondingTipEl = document.getElementById('bonding-tip');
    this.questTitleEl = document.getElementById('quest-title');
    this.questProgressEl = document.getElementById('quest-progress');
    this.toastEl = document.getElementById('education-toast');

    this.score = 0;
    this.moleculeCount = 0;
  }

  updateScore(value) {
    this.score = value;
    this.scoreEl.textContent = `Score: ${value}`;
  }

  incrementMolecule() {
    this.moleculeCount += 1;
    this.moleculesEl.textContent = `H₂O: ${this.moleculeCount}`;
    this.updateScore(this.score + 150);
  }

  reset() {
    this.score = 0;
    this.moleculeCount = 0;
    this.scoreEl.textContent = 'Score: 0';
    this.moleculesEl.textContent = 'H₂O: 0';
  }

  setSelectedAtom(atom) {
    if (!atom) {
      this.selectedEl.textContent = 'None';
      this.valenceEl.textContent = 'Valence: —';
      return;
    }
    this.selectedEl.textContent = atom.type === 'H' ? 'Hydrogen' : 'Oxygen';
    this.valenceEl.textContent = `Valence: ${atom.valence} | Bonds: ${atom.bonds.length}`;
  }

  setBondingTip(text) {
    this.bondingTipEl.textContent = text;
  }

  updateQuest(title, ratio) {
    this.questTitleEl.textContent = title;
    this.questProgressEl.style.width = `${Math.min(ratio * 100, 100)}%`;
  }

  updateQuality(text) {
    this.qualityEl.textContent = `Quality: ${text}`;
  }

  showEducation(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2800);
  }
}
