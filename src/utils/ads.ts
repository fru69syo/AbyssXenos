// AdMob wrapper - placeholder for Capacitor AdMob plugin integration
// Actual implementation requires @capacitor-community/admob

export class AdsManager {
  private adsRemoved: boolean = false;

  async initialize(): Promise<void> {
    // Will initialize AdMob when Capacitor plugin is added
  }

  async showBanner(): Promise<void> {
    if (this.adsRemoved) return;
    // AdMob.showBanner(...)
  }

  async hideBanner(): Promise<void> {
    // AdMob.hideBanner()
  }

  async showRewarded(): Promise<boolean> {
    // Returns true if user watched the full ad
    // For now, simulate success
    return true;
  }

  async showInterstitial(): Promise<void> {
    if (this.adsRemoved) return;
    // AdMob.showInterstitial(...)
  }

  setAdsRemoved(removed: boolean): void {
    this.adsRemoved = removed;
  }
}
