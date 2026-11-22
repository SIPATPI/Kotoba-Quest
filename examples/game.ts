export const routes = ['home', 'adventure', 'learn', 'battle', 'profile'] as const;
export type Route = typeof routes[number];
export type Course = 'sakura' | 'minna';
export const courseNames:Record<Course,string>={sakura:'หมู่บ้านซากุระ',minna:'Minna · เล่ม 1'};
export function inCourse(chapterId:string,course:Course){return course==='minna'?chapterId.startsWith('n5-minna-'):/^n5-c[1-3]$/.test(chapterId);}
export function courseProgress(data:Bootstrap,course:Course){const activities=data.activities.filter(a=>inCourse(a.chapterId,course));return {activities,chapters:data.chapters.filter(c=>inCourse(c.chapterId,course)),bosses:data.bosses.filter(b=>inCourse(b.chapterId,course)),completed:activities.filter(a=>data.clearedActivityIds.includes(a.activityId)).length};}
export function isRoute(value: unknown): value is Route {
  return typeof value === 'string' && routes.some(route => route === value);
}
export interface Activity {
  activityId: string; chapterId: string; title: string; activityType: string;
  available: boolean; lockReason: string; guideCompleted: boolean;
  canChallenge: boolean; questionCount: number; passThreshold: number;
  missionSummary?: { assessmentReady: boolean; taughtWords: number } | null;
}
export interface Bootstrap {
  profile: { characterName: string; characterClass: string; level: number; xp: number; totalXp: number; xpToNext: number };
  needsCharacterCreation: boolean;
  learningEntry: { needsSelection: boolean; entryChapterId: string; selectedId?: string|null };
  kanaStartingPoint?: 'new'|'known'|null;
  hanaStory?: {available:boolean;started:boolean;completed:boolean;active:boolean;turn:number;total:number;lanternLit:boolean;souvenir:boolean;branch:'sit'|'takeaway'|null};
  vocabularySummary: { learnedCount: number; totalWords: number; dueCount: number; weakCount: number; overallLabel: string };
  clearedActivityIds: string[];
  activities: Activity[];
  chapters: Array<{ chapterId: string; title: string; displayOrder: number; campaignCompleted: boolean; unlocked: boolean }>;
  bosses: Array<{ bossId: string; chapterId: string; bossName: string; available: boolean }>;
  activeLearning: null | { sessionId: string; mode: string; currentTurn: number; totalQuestions: number; activity: Activity };
  activeBattle: null | { bossId: string; bossName: string };
  spiritFlame: { enabled: boolean; currentStreak: number; ruleTH: string; days: Array<{ date: string; completed: boolean; today: boolean }> };
  village: { enabled: boolean; restoredCount: number; quests: Array<{ questId: string; title: string; npcName: string; available: boolean; completed: boolean; objectiveTH: string; rewardXp: number }> };
  contentSummary: { lessonCount: number; questionCount: number; chapterCount: number; bossCount: number };
}
export type LegacyAction = 'guide' | 'challenge' | 'resume-lesson' | 'battle' | 'vocabulary-notebook' | 'vocabulary-review' | 'quest-open' | 'minna-chapter';
export interface Destination { route: Route; action?: LegacyAction; id?: string; panel?: 'kana'|'hana'; course?:Course }
export interface NextStep extends Destination { title: string; description: string; button: string }
export function kanaEntryMode(data:Bootstrap):'ask'|'new'|'known'|'hidden'{
  if(data.kanaStartingPoint==='known'||data.kanaStartingPoint==='new')return data.kanaStartingPoint;
  if(data.needsCharacterCreation||data.learningEntry.needsSelection)return 'hidden';
  if(['basics','confident'].includes(data.learningEntry.selectedId||'')||['n5-c2','n5-c3'].includes(data.learningEntry.entryChapterId))return 'known';
  return data.learningEntry.selectedId==='beginner'||data.learningEntry.entryChapterId==='n5-c1'?'ask':'hidden';
}
export function nextMinnaChapter(data:Bootstrap){
 const chapters=data.chapters.filter(c=>c.chapterId.startsWith('n5-minna-c')).sort((a,b)=>a.displayOrder-b.displayOrder);
 return chapters.find(c=>c.unlocked&&!c.campaignCompleted)?.chapterId||chapters[0]?.chapterId;
}
export const activityNames: Record<string, string> = {
  vocabulary: 'คำศัพท์', grammar: 'ไวยากรณ์', kanji: 'อ่านคันจิ', reading: 'อ่านจับใจความ', conversation: 'บทสนทนา',
};
export const classNames: Record<string, string> = {
  'Kotoba Mage': 'จอมเวทถ้อยคำ', 'Kanji Guardian': 'ผู้พิทักษ์อักษร', 'Sakura Samurai': 'ซามูไรซากุระ',
  'Kotoba Ranger': 'พลธนูนักสำรวจ',
};
export function nextStep(data: Bootstrap,course:Course='sakura'): NextStep {
  const path=courseProgress(data,course);
  if (data.needsCharacterCreation) return { route: 'profile', title: 'สร้างนักเดินทางของคุณ', description: 'ตั้งชื่อและเลือกอาชีพ ก่อนเริ่มเส้นทางแห่งถ้อยคำ', button: 'เริ่มการเดินทาง' };
  if (data.learningEntry.needsSelection) return { route: 'adventure', title: 'เลือกจุดเริ่มต้นที่เหมาะกับคุณ', description: 'เลือกพื้นฐานที่มีอยู่ แล้วเริ่มเรียนจากบทที่เหมาะสม', button: 'เลือกเส้นทางเรียน' };
  const active = data.activeLearning;
  if (active&&(active.mode==='review'||inCourse(active.activity.chapterId,course))) {
    const activity = data.activities.find(item => item.activityId === active.activity.activityId);
    if (activity?.canChallenge && ['practice', 'mission'].includes(active.mode) && !data.clearedActivityIds.includes(activity.activityId)) {
      return { route: 'learn', action: 'challenge', id: activity.activityId, title: 'พร้อมลงด่าน '+(activityNames[activity.activityType] || activity.title), description: `ด่านหลักผ่านที่ ${activity.passThreshold}/12 · ฝึกซ้อมเป็นทางเลือก`, button: 'ลงด่านจริง' };
    }
    return { route: 'learn', action: 'resume-lesson', title: 'เรียน'+(activityNames[active.activity.activityType] || active.activity.title)+'ต่อ', description: `ทำไปแล้ว ${active.currentTurn}/${active.totalQuestions} ข้อ · กลับมาเรียนจากที่บันทึกไว้`, button: 'เรียนต่อ' };
  }
  if (data.activeBattle&&path.bosses.some(b=>b.bossId===data.activeBattle?.bossId)) return { route: 'battle', action: 'battle', id: data.activeBattle.bossId, title: 'ศึก '+data.activeBattle.bossName, description: 'กลับไปสู้ต่อจากเทิร์นที่บันทึกไว้', button: 'ต่อสู้ต่อ' };
  const chapter = [...path.chapters].sort((a,b)=>a.displayOrder-b.displayOrder).find(item => item.unlocked && !item.campaignCompleted);
  const activity = path.activities.find(item => item.chapterId === chapter?.chapterId && item.available && !data.clearedActivityIds.includes(item.activityId));
  if (activity) {
    const canChallenge = activity.canChallenge;
    return { route: 'learn', action: canChallenge ? 'challenge' : 'guide', id: activity.activityId,
      title: (canChallenge ? 'ด่าน' : 'เรียน')+(activityNames[activity.activityType] || activity.title),
      description: canChallenge ? `ผ่านที่ ${activity.passThreshold}/12 · เต็ม 12/12 ได้ Perfect Mastery` : 'อ่านคำอธิบายและตัวอย่าง แล้วเลือกฝึกหรือลงด่านเมื่อพร้อม', button: 'เริ่มเรียน' };
  }
  const boss = path.bosses.find(item => item.chapterId === chapter?.chapterId && item.available);
  if (boss) return { route: 'battle', action: 'battle', id: boss.bossId, title: 'ท้าทาย '+boss.bossName, description: 'ผ่านบทเรียนแล้ว นำความรู้มารับมือผู้พิทักษ์', button: 'ท้าทายผู้พิทักษ์' };
  return { route: 'adventure', title: course==='minna'?'สำรวจเส้นทาง Minna':'ออกสำรวจหมู่บ้านซากุระ', description: course==='minna'?'กลับไปทบทวนบทที่เรียนและผู้พิทักษ์ประจำบท':'ทบทวนเส้นทางเดิม หรือช่วยชาวบ้านด้วยภาษาที่เรียนมา', button: 'สำรวจแผนที่' };
}

