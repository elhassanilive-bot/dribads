export const site = {
  name: 'دريبدو',
  nameEn: 'Dribdo',
  description:
    'منصة تواصل اجتماعي عربية حديثة تجمع المنشورات والقصص والقنوات والمجتمعات في تجربة واحدة سريعة وواضحة.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dribdo.com',
  socials: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || '',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || '',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL || '',
  },
};
