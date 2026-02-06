export default class QuestSystem {
  constructor(uiController) {
    this.uiController = uiController;
    this.quests = [
      { title: 'Form 1 water molecule', target: 1 },
      { title: 'Form 3 water molecules', target: 3 },
      { title: 'Form water with correct bond angle', target: 5 },
    ];
    this.currentIndex = 0;
    this.progress = 0;
    this.uiController.updateQuest(this.quests[this.currentIndex].title, 0);
  }

  onMoleculeCreated(total) {
    const quest = this.quests[this.currentIndex];
    if (!quest) return;
    this.progress = Math.min(total, quest.target);
    const ratio = this.progress / quest.target;
    this.uiController.updateQuest(quest.title, ratio);
    if (ratio >= 1) {
      this.currentIndex += 1;
      const nextQuest = this.quests[this.currentIndex];
      if (nextQuest) {
        this.uiController.updateQuest(nextQuest.title, 0);
      } else {
        this.uiController.updateQuest('All quests complete!', 1);
      }
    }
  }
}
