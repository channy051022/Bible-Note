import { Devotion, DevotionCategory } from '../types/devotion';
import { getTodayVerseRef, DailyVerseRef, DAILY_VERSES } from '../constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../constants/BibleBooks';

export const CURATED_DEVOTIONS: Devotion[] = [
  {
    id: 'devotion-prov-3-5',
    title: "Trusting God When You Can't See the Way",
    scriptureCitation: 'Proverbs 3:5–6',
    scriptureText: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    bookId: 20,
    chapter: 3,
    verse: 5,
    category: 'Guidance',
    reflectionContent:
      'Sometimes we want to know exactly what will happen before we take the next step. We analyze every possible scenario, looking for certainty in circumstances that are constantly changing.\n\nGod invites us to a different way of living—one rooted not in our limited understanding, but in His infinite wisdom and unfailing love. Trusting with all your heart does not mean you have no questions; it means choosing to surrender your uncertainties into the hands of the One who knows the end from the beginning.\n\nWhen we acknowledge God in every decision, big or small, He promises to direct our steps. You do not need to figure out the whole journey today; you only need to walk in obedience for the step in front of you.',
    reflectionQuestion: 'What situation or decision are you struggling to trust God with today?',
    prayer: 'Lord, help me trust You even when I do not understand what is happening around me. Silence my anxious thoughts, grant me Your peace, and guide each step I take today. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'devotion-john-3-16',
    title: 'The Infinite Depths of Unconditional Love',
    scriptureCitation: 'John 3:16',
    scriptureText: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    bookId: 43,
    chapter: 3,
    verse: 16,
    category: 'Love',
    reflectionContent:
      'Love is often measured by what someone is willing to sacrifice. In human terms, love can fluctuate based on feelings, performance, or reciprocity. But God’s love for you is not dependent on what you achieve or how well you perform.\n\nBefore you ever sought Him, God gave His most precious treasure—His Son Jesus Christ. This verse is not just a theological truth; it is a personal love letter addressed to your soul. In every season of feeling unseen, unworthy, or exhausted, remember that the Creator of the universe deemed you worth dying for.\n\nRest in the assurance that nothing in all creation can separate you from this love. You are deeply known, fiercely protected, and eternally cherished.',
    reflectionQuestion: 'How does knowing God loves you unconditionally change how you view your worth today?',
    prayer: 'Heavenly Father, thank You for loving me beyond measure. When feelings of insecurity or unworthiness arise, anchor my heart in the truth of the cross. Help me to extend this same grace and love to those around me. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'devotion-phil-4-13',
    title: 'Strength Beyond Your Own Limits',
    scriptureCitation: 'Philippians 4:13',
    scriptureText: 'I can do all this through him who gives me strength.',
    bookId: 50,
    chapter: 4,
    verse: 13,
    category: 'Strength',
    reflectionContent:
      'The apostle Paul wrote these words not from a place of comfort or luxury, but from inside a Roman prison cell. He had learned the secret of contentment in every situation—whether facing plenty or hunger, abundance or need.\n\nThis strength is not self-reliance, stubborn grit, or positive thinking. It is the supernatural, indwelling power of Christ filling your spirit when your natural energy is depleted. When you come to the end of your own resources, God’s power is made perfect in your weakness.\n\nWhatever mountain, trial, or responsibility feels overwhelming today, you are not called to bear it alone. Christ is your source, your resilience, and your peace.',
    reflectionQuestion: 'Where do you feel weary today, and how can you invite Christ’s strength into that area?',
    prayer: 'Lord Jesus, when my own strength falls short, fill me with Your divine power. Grant me perseverance to face today’s responsibilities with joy and peace, knowing You are holding me up. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'devotion-psalm-23-1',
    title: 'The Shepherd Who Leaves Nothing Lacking',
    scriptureCitation: 'Psalm 23:1',
    scriptureText: 'The Lord is my shepherd; I shall not want.',
    bookId: 19,
    chapter: 23,
    verse: 1,
    category: 'Peace',
    reflectionContent:
      'A sheep is completely reliant on its shepherd for nourishment, direction, and protection. Left to itself, a sheep easily wanders into danger and is unable to defend against predators.\n\nDavid recognized that with Yahweh as his Shepherd, he had everything he truly needed. In a culture driven by relentless striving and constant dissatisfaction, Jesus invites you to lie down in green pastures and be led beside quiet waters.\n\nYour Good Shepherd knows what you need before you even ask. He restores your weary soul, leads you in paths of righteousness, and walks beside you even through the darkest valleys of grief or confusion.',
    reflectionQuestion: 'In what area of your life are you currently experiencing spiritual or mental restlessness?',
    prayer: 'Good Shepherd, thank You for caring for every detail of my life. Quiet the noise in my mind and lead my soul beside still waters today. I choose to rest in Your complete provision. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'devotion-jer-29-11',
    title: 'A Hope and a Future in God’s Hands',
    scriptureCitation: 'Jeremiah 29:11',
    scriptureText: '“For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”',
    bookId: 24,
    chapter: 29,
    verse: 11,
    category: 'Hope',
    reflectionContent:
      'God spoke these words to the Israelites while they were exiled in Babylon—a season marked by longing, displacement, and grief. It was during their darkest chapter that God reminded them: their current location was not their final destination.\n\nWhen seasons of waiting or unexpected disruptions occur, it is easy to wonder if God has forgotten His promises. But God’s plans for your redemption and growth are never derailed by human delays or worldly setbacks.\n\nHe is actively weaving every heartache, trial, and delay into a tapestry of hope and eternal purpose. Trust His heart even when you cannot trace His hand.',
    reflectionQuestion: 'What unanswered question or waiting season can you place into God’s faithful hands today?',
    prayer: 'Father, thank You that my future is secure in Your hands. When doubt whispers that hope is lost, remind me of Your faithful promises. Help me to wait on You with patient confidence. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'devotion-isa-40-31',
    title: 'Soaring on Wings Like Eagles',
    scriptureCitation: 'Isaiah 40:31',
    scriptureText: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    bookId: 23,
    chapter: 40,
    verse: 31,
    category: 'Faith',
    reflectionContent:
      'Eagles do not flap furiously against the storm; instead, they lock their wings and ride the thermal wind currents that lift them above the turbulence.\n\nWaiting on the Lord is not passive inactivity; it is an active posture of expectant faith and dependence. When you stop striving in human effort and place your hope entirely in God’s power, He exchanges your exhaustion for His supernatural vitality.\n\nYou may be walking through a season where just putting one foot in front of the other feels heavy. Take heart: God promises that those who trust in Him will not faint.',
    reflectionQuestion: 'What thermal currents of God’s grace and promises can you lean into today rather than struggling on your own?',
    prayer: 'Lord, I wait on You. Renew my tired mind, restore my weary spirit, and lift me above the distractions and anxieties of today. Let Your peace carry me through. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-06T00:00:00.000Z',
  },
  {
    id: 'devotion-matt-6-33',
    title: 'Seeking the Kingdom First',
    scriptureCitation: 'Matthew 6:33',
    scriptureText: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
    bookId: 40,
    chapter: 6,
    verse: 33,
    category: 'Anxiety & Worry',
    reflectionContent:
      'We often spend immense energy worrying about what we will eat, wear, achieve, or preserve. Jesus gently points our attention to the lilies of the field and the birds of the air—none of which toil or spin, yet Heavenly Father clothes and feeds them in majesty.\n\nWhen we align our primary desire with God’s kingdom—His character, His will, and His presence—our daily needs fall into their proper perspective. Worry changes nothing, but seeking God transforms everything.\n\nMake time today to seek His heart before tackling your to-do list. Let His righteousness be your chief pursuit, trusting that your needs are seen and known by your loving Father.',
    reflectionQuestion: 'What earthly concern has been occupying too much of your thoughts lately, and how can you surrender it to God?',
    prayer: 'Heavenly Father, align my priorities with Your eternal Kingdom. Free my heart from the trap of worry and consumerism. Teach me to seek Your presence first in all things. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-07T00:00:00.000Z',
  },
  {
    id: 'devotion-phil-4-6',
    title: 'Trading Anxiety for Supernatural Peace',
    scriptureCitation: 'Philippians 4:6–7',
    scriptureText: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    bookId: 50,
    chapter: 4,
    verse: 6,
    category: 'Prayer',
    reflectionContent:
      'Anxiety is a heavy burden that weighs down the heart. God does not command us to ignore our difficulties or pretend everything is easy. Instead, He gives us a divine exchange: trade your worries for prayer and thanksgiving.\n\nWhen you vocalize your specific needs to God while intentionally thanking Him for His past faithfulness, something extraordinary happens. The peace of God—a serenity that defies human explanation—acts like a garrison of heavenly guards around your thoughts and emotions.\n\nYou do not have to carry the weight of tomorrow. Bring every single thought to the throne of grace today.',
    reflectionQuestion: 'What is one specific gratitude you can offer to God right now in the midst of your current challenges?',
    prayer: 'Lord, I release every knot of anxiety into Your capable hands. Thank You for Your past faithfulness. Fill my mind with Your peace that surpasses understanding, and protect my heart from fear. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-08T00:00:00.000Z',
  },
  {
    id: 'devotion-eph-4-32',
    title: 'The Freedom of Gracious Forgiveness',
    scriptureCitation: 'Ephesians 4:32',
    scriptureText: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',
    bookId: 49,
    chapter: 4,
    verse: 32,
    category: 'Forgiveness',
    reflectionContent:
      'Unforgiveness is often described as drinking poison and expecting the other person to suffer. Holding onto grudges, bitterness, and offenses only imprisons our own hearts in pain.\n\nGod’s call to forgive is not an endorsement of wrong behavior, nor does it mean minimizing deep wounds. It means relinquishing the right to seek revenge and releasing the offender to God’s justice.\n\nWe forgive not because the other person deserves it, but because Christ has graciously cancelled our own insurmountable debt of sin. As we receive His limitless mercy, we are empowered to release others into that same freedom.',
    reflectionQuestion: 'Is there someone you have been harboring resentment against? How can you begin the process of forgiveness today?',
    prayer: 'Jesus, thank You for forgiving all my sins and wiping my slate clean. Give me the grace to release all bitterness, resentment, and unforgiveness. Soften my heart with Your compassion. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-09T00:00:00.000Z',
  },
  {
    id: 'devotion-1thess-5-16',
    title: 'Cultivating a Lifestyle of Constant Gratitude',
    scriptureCitation: '1 Thessalonians 5:16–18',
    scriptureText: 'Rejoice always, pray continually, give thanks in all circumstances; for this is God’s will for you in Christ Jesus.',
    bookId: 52,
    chapter: 5,
    verse: 16,
    category: 'Gratitude',
    reflectionContent:
      'Giving thanks in all circumstances does not mean pretending that painful things are good. Rather, it is an acknowledgment that even in dark valleys, God remains sovereign, faithful, and good.\n\nGratitude shifts our focus from what is lacking to the abundance of God’s grace already surrounding us. When gratitude becomes our default reaction, joy begins to overflow regardless of external conditions.\n\nTake a moment to notice the small blessings: the breath in your lungs, the beauty of creation, the comfort of a friend, the promise of salvation. Gratitude is the soil where true joy takes root.',
    reflectionQuestion: 'What are three simple blessings you often take for granted that you can thank God for today?',
    prayer: 'Lord, open my eyes to see the countless blessings You pour into my life every day. In seasons of joy and seasons of trial, let praise and thanksgiving continually be on my lips. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'devotion-james-1-5',
    title: 'Asking for Divine Wisdom with Faith',
    scriptureCitation: 'James 1:5',
    scriptureText: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
    bookId: 59,
    chapter: 1,
    verse: 5,
    category: 'Wisdom',
    reflectionContent:
      'Human intelligence is the accumulation of knowledge, but divine wisdom is the ability to see life through God’s perspective and act accordingly.\n\nWhen you face complex dilemmas—in relationships, career, family, or spiritual growth—God does not scold you for your lack of answers. He is a generous Father who delights in giving discernment to those who ask in humble faith.\n\nBefore you seek advice from the world or react impulsively, pause and ask the Holy Spirit for guidance. God’s wisdom is pure, peace-loving, considerate, and full of good fruits.',
    reflectionQuestion: 'In what current challenge do you most need God’s heavenly wisdom and clarity today?',
    prayer: 'Father, I come to You recognizing my need for Your guidance. Grant me discernment to navigate my decisions with integrity and grace. Direct my steps according to Your holy Word. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-11T00:00:00.000Z',
  },
  {
    id: 'devotion-gal-5-22',
    title: 'Bearing the Fruit of the Holy Spirit',
    scriptureCitation: 'Galatians 5:22–23',
    scriptureText: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.',
    bookId: 48,
    chapter: 5,
    verse: 22,
    category: 'Personal Growth',
    reflectionContent:
      'Spiritual maturity is not measured by spiritual gifts or external performance, but by the fruit produced in our character through intimacy with Christ.\n\nA branch does not produce fruit by straining and striving; it produces fruit by remaining connected to the vine. When we abide in Jesus through prayer, meditation on Scripture, and obedience, the Holy Spirit naturally produces Christlike love, patience, and kindness in our daily interactions.\n\nPersonal growth is a gentle, steady process of pruning and nurturing. Trust the Master Gardener to cultivate enduring fruit in your soul.',
    reflectionQuestion: 'Which aspect of the fruit of the Spirit do you sense God is cultivating in your life right now?',
    prayer: 'Holy Spirit, cultivate in me the character of Christ. Prune away habits of selfishness, impatience, and anger. Help me abide deeply in Jesus so that my life may bear sweet, lasting fruit. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'devotion-josh-1-9',
    title: 'Courage Born from God’s Unfailing Presence',
    scriptureCitation: 'Joshua 1:9',
    scriptureText: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    bookId: 6,
    chapter: 1,
    verse: 9,
    category: 'Strength',
    reflectionContent:
      'Joshua stood on the threshold of leading Israel into the Promised Land after the death of Moses. The task before him was monumental, filled with fortified cities and formidable giants.\n\nGod’s command to be strong and courageous was not based on Joshua’s military prowess or strategic brilliance. The bedrock of his courage was a promise: “The Lord your God will be with you wherever you go.”\n\nTrue courage is not the absence of fear, but the presence of God overcoming fear. Whatever unknown territory you are entering today, you do not walk alone. The Almighty goes before you and stands behind you.',
    reflectionQuestion: 'What intimidation or unknown territory is God asking you to step into with courage today?',
    prayer: 'Lord God, thank You for Your promised presence. When fear or discouragement tries to paralyze me, remind me that You are with me wherever I go. Grant me the courage to step forward in faith. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-13T00:00:00.000Z',
  },
  {
    id: 'devotion-psalm-46-1',
    title: 'A Refuge and Very Present Help in Trouble',
    scriptureCitation: 'Psalm 46:1–2',
    scriptureText: 'God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.',
    bookId: 19,
    chapter: 46,
    verse: 1,
    category: 'Peace',
    reflectionContent:
      'The world around us can sometimes feel like it is shaking at its very foundations. Financial uncertainty, health scares, and cultural turmoil can cause our hearts to feel unsettled.\n\nPsalm 46 reminds us that God is not a distant observer; He is an immediate refuge and an ever-present fortress. A refuge is not somewhere you look at from afar; it is a place you run into for safety and sanctuary.\n\nWhen storms rage, be still and know that He is God. His kingdom cannot be shaken, and your soul is securely anchor in His unfailing love.',
    reflectionQuestion: 'How can you consciously step into God as your personal refuge during moments of stress today?',
    prayer: 'Heavenly Father, You are my safe haven and my fortress. When my world feels turbulent, quiet my racing thoughts. I choose to be still and trust in Your sovereign goodness. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-14T00:00:00.000Z',
  },
  {
    id: 'devotion-rom-8-28',
    title: 'All Things Working Together for Good',
    scriptureCitation: 'Romans 8:28',
    scriptureText: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    bookId: 45,
    chapter: 8,
    verse: 28,
    category: 'Hope',
    reflectionContent:
      'This verse does not claim that all things are inherently good. Pain, betrayal, sickness, and loss are real and painful. But God is so sovereign and full of redemptive grace that He is able to take even broken fragments and weave them into something purposeful.\n\nLike a master tapestry maker, God uses both the bright gold threads of joy and the dark threads of hardship to create a stunning masterpiece of spiritual maturity and glory.\n\nYou can trust that no trial you endure is wasted in the hands of your Redeemer. He is working behind the scenes for your ultimate good and His glory.',
    reflectionQuestion: 'Looking back on past hardships, how have you seen God bring unexpected good or growth out of difficulty?',
    prayer: 'Lord Jesus, I trust Your redemptive hand over my life. Even when I cannot see how current struggles will resolve, I believe You are working all things for good. Strengthen my faith today. Amen.',
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

/**
 * Returns the daily devotion aligned with today's verse from getTodayVerseRef().
 * Uses the day of the year to pick or build the devotional reflection.
 */
export function getTodayDevotion(date: Date = new Date()): Devotion {
  const verseRef: DailyVerseRef = getTodayVerseRef();
  const book = BIBLE_BOOKS.find((b) => b.id === verseRef.bookId);
  const bookName = book ? book.name : 'Scripture';

  // Format date key YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  // Find if there is a matching curated devotion by bookId and chapter
  const matched = CURATED_DEVOTIONS.find(
    (d) => d.bookId === verseRef.bookId && d.chapter === verseRef.chapter
  );

  if (matched) {
    return {
      ...matched,
      id: `daily-${dateKey}`,
      dateKey,
    };
  }

  // Otherwise, use modular day index to select from curated list and align with today
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % CURATED_DEVOTIONS.length;

  const base = CURATED_DEVOTIONS[index];
  return {
    ...base,
    id: `daily-${dateKey}`,
    dateKey,
  };
}

/**
 * Generates or builds a devotion for any given Bible verse reference.
 */
export function generateDevotionForVerse(
  bookId: number,
  chapter: number,
  verse: number,
  verseText: string,
  category: DevotionCategory = 'Faith'
): Devotion {
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  const bookName = book ? book.name : 'Bible';
  const citation = `${bookName} ${chapter}:${verse}`;

  return {
    id: `custom-verse-${bookId}-${chapter}-${verse}-${Date.now()}`,
    title: `Reflecting on ${citation}`,
    scriptureCitation: citation,
    scriptureText: verseText,
    bookId,
    chapter,
    verse,
    category,
    reflectionContent: `In this sacred passage from ${citation}, God speaks directly to our hearts: "${verseText}"\n\nTake a moment to pause and let these words penetrate deep into your spirit. Meditate on the character of God revealed here. What is the Lord inviting you to see, surrender, or step into?\n\nAs you walk through your day, carry this verse as a lamp unto your feet and a light unto your path.`,
    reflectionQuestion: `How does ${citation} speak to your current circumstances today?`,
    prayer: `Lord God, open my heart to the eternal truth of ${citation}. Guide my thoughts, calm my fears, and let Your Word guide every step I take today. Amen.`,
    estimatedReadingMinutes: 3,
    isUserCreated: false,
    createdAt: new Date().toISOString(),
  };
}
