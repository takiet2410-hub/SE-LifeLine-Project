import type { TipCardProps, FAQItemProps } from '../types/healthTips.types';

export const HEALTH_TIPS_DATA: TipCardProps[] = [
  {
    id: 'nutrition',
    titleKey: 'healthTips.categories.nutrition.title',
    descriptionKey: 'healthTips.categories.nutrition.desc',
    iconName: 'Apple',
    imageFallbackUrl: '/images/nutrition.jpg',
  },
  {
    id: 'hydration',
    titleKey: 'healthTips.categories.hydration.title',
    descriptionKey: 'healthTips.categories.hydration.desc',
    iconName: 'Droplet',
    imageFallbackUrl: '/images/hydration.jpg',
  },
  {
    id: 'recovery',
    titleKey: 'healthTips.categories.recovery.title',
    descriptionKey: 'healthTips.categories.recovery.desc',
    iconName: 'Activity',
    imageFallbackUrl: '/images/recovery.jpg',
  },
  {
    id: 'iron',
    titleKey: 'healthTips.categories.iron.title',
    descriptionKey: 'healthTips.categories.iron.desc',
    iconName: 'Beef',
    imageFallbackUrl: '/images/iron.jpg',
  },
  {
    id: 'sleep',
    titleKey: 'healthTips.categories.sleep.title',
    descriptionKey: 'healthTips.categories.sleep.desc',
    iconName: 'Moon',
    imageFallbackUrl: '/images/sleep.jpg',
  },
  {
    id: 'exercise',
    titleKey: 'healthTips.categories.exercise.title',
    descriptionKey: 'healthTips.categories.exercise.desc',
    iconName: 'Dumbbell',
    imageFallbackUrl: '/images/exercise.jpg',
  },
];

export const FAQ_DATA: FAQItemProps[] = [
  {
    id: 'faq1',
    questionKey: 'healthTips.faq.q1.question',
    answerKey: 'healthTips.faq.q1.answer',
  },
  {
    id: 'faq2',
    questionKey: 'healthTips.faq.q2.question',
    answerKey: 'healthTips.faq.q2.answer',
  },
  {
    id: 'faq3',
    questionKey: 'healthTips.faq.q3.question',
    answerKey: 'healthTips.faq.q3.answer',
  },
];
