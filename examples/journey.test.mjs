import assert from 'node:assert/strict';
import test from 'node:test';
import { nextStep } from './game.ts';

test('เรียนต่อในซากุระได้ และเมื่อเปลี่ยนเป็น Minna จะพาไปบทของ Minna', () => {
  const sakura = { activityId: 'n5-c1-vocabulary', chapterId: 'n5-c1', activityType: 'vocabulary' };
  const minna = { activityId: 'n5-minna-c1-grammar', chapterId: 'n5-minna-c1', activityType: 'grammar', available: true };
  const player = {
    needsCharacterCreation: false,
    learningEntry: { needsSelection: false },
    activities: [sakura, minna],
    chapters: [{ chapterId: minna.chapterId, unlocked: true, displayOrder: 1 }],
    bosses: [],
    clearedActivityIds: [],
    activeLearning: { mode: 'challenge', currentTurn: 3, totalQuestions: 12, activity: sakura },
  };

  assert.equal(nextStep(player, 'sakura').action, 'resume-lesson');
  const destination = nextStep(player, 'minna');
  assert.equal(destination.action, 'guide');
  assert.equal(destination.id, minna.activityId);
});

