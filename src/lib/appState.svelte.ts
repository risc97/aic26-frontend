class AppState {
  qaEnabled = $state(false);

  toggleQA() {
    this.qaEnabled = !this.qaEnabled;
  }
}

export const appState = new AppState();