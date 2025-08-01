import { TestBed } from '@angular/core/testing';

import { ThreatService } from './threat.service';

describe('ThreatService', () => {
  let service: ThreatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
