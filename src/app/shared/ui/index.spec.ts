import { describe, expect, it } from 'vitest';
import * as orgUi from './index';

describe('shared UI public API', () => {
  it('exports every foundation primitive through one feature-independent barrel', () => {
    expect(orgUi.OrgSurfaceComponent).toBeDefined();
    expect(orgUi.OrgPageLayoutComponent).toBeDefined();
    expect(orgUi.OrgPageHeaderComponent).toBeDefined();
    expect(orgUi.OrgSectionComponent).toBeDefined();
    expect(orgUi.OrgIconComponent).toBeDefined();
    expect(orgUi.ORG_ICON_MAP.menu).toBe('menu');
    expect(orgUi.OrgEmptyStateComponent).toBeDefined();
    expect(orgUi.FeedbackSnackbarComponent).toBeDefined();
    expect(orgUi.FeedbackService).toBeDefined();
    expect(orgUi.OrgBannerComponent).toBeDefined();
  });
});
