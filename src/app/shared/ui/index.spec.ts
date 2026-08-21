import { describe, expect, it } from 'vitest';
import * as orgUi from './index';

describe('shared UI public API', () => {
  it('exports every foundation primitive through one feature-independent barrel', () => {
    expect(orgUi.OrgSurfaceComponent).toBeDefined();
    expect(orgUi.OrgFormFieldDirective).toBeDefined();
    expect(orgUi.OrgFieldLabelDirective).toBeDefined();
    expect(orgUi.OrgButtonDirective).toBeDefined();
    expect(orgUi.OrgIconButtonDirective).toBeDefined();
    expect(orgUi.OrgChipDirective).toBeDefined();
    expect(orgUi.OrgIconComponent).toBeDefined();
    expect(orgUi.ORG_ICON_MAP.menu).toBe('menu');
  });
});
