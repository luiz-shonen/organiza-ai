import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfettiService } from './confetti.service';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('ConfettiService', () => {
  let service: ConfettiService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ConfettiService],
    });
    service = TestBed.inject(ConfettiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should trigger canvas-confetti bursts with theme colors on fireSuccessConfetti', () => {
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });

    service.fireSuccessConfetti();

    expect(confetti).toHaveBeenCalledTimes(2);
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 5,
        angle: 60,
        colors: ['#ff4d94', '#ff8c42', '#6b4c9a'],
      })
    );
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 5,
        angle: 120,
        colors: ['#ff4d94', '#ff8c42', '#6b4c9a'],
      })
    );
  });

  it('should stop requesting animation frames after duration expires', () => {
    const start = 1000;
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(start) // initial now
      .mockReturnValueOnce(start + 4000); // inside frame after duration

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    service.fireSuccessConfetti();

    expect(rafSpy).not.toHaveBeenCalled();
  });
});
