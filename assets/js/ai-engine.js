/* ==========================================================================
   ADVANCED FEATURE: AI DESCRIPTION GENERATOR
   ========================================================================== */

/**
 * Generates an enhanced, professional item description from raw user inputs.
 * Synthesizes intelligent prompt tags, item details, location, and features.
 */
export async function generateAIDescription({ title, itemType, category, location, color, features, rawPrompts }) {
  // Simulate AI processing for realistic UX
  await new Promise(res => setTimeout(res, 500));

  const promptText = (rawPrompts || '').trim();
  const titleText = (title || '').trim();
  const colorText = (color || '').trim();
  const featuresText = (features || '').trim();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const itemSubject = titleText || (colorText ? `${colorText} Item` : 'Item');
  const typeText = itemType === 'lost' ? 'Lost Item Report' : 'Found Item Notification';

  let sections = [];

  // Section 1: Overview
  if (itemType === 'lost') {
    sections.push(`[URGENT LOST REPORT] This is a report regarding a lost ${colorText ? colorText.toLowerCase() + ' ' : ''}${itemSubject.toLowerCase()}.`);
  } else {
    sections.push(`[FOUND ITEM NOTIFICATION] A ${colorText ? colorText.toLowerCase() + ' ' : ''}${itemSubject.toLowerCase()} has been found on campus and secured.`);
  }

  // Section 2: Location & Category Context
  if (location && location !== 'all' && category && category !== 'all') {
    sections.push(`Classification: Categorized under "${category}" and last recorded near ${location} on ${dateStr}.`);
  } else if (location && location !== 'all') {
    sections.push(`Location Note: Recorded near ${location} on ${dateStr}.`);
  } else if (category && category !== 'all') {
    sections.push(`Classification: Categorized under "${category}".`);
  }

  // Section 3: Prompts & Distinguishing Details
  let detailNotes = [];
  if (colorText) detailNotes.push(`Color/Finish: ${colorText}`);
  if (featuresText) detailNotes.push(`Distinguishing Marks: ${featuresText}`);
  if (promptText) detailNotes.push(`Additional Notes: ${promptText}`);

  if (detailNotes.length > 0) {
    sections.push(`Key Particulars:\n- ${detailNotes.join('\n- ')}`);
  }

  // Section 4: Call to Action / Next Steps
  if (itemType === 'found') {
    sections.push(`If you believe this is your item, please submit an ownership claim with proof or contact details to verify ownership.`);
  } else {
    sections.push(`If you have seen this item or have any information regarding its whereabouts, please contact the owner immediately.`);
  }

  return sections.join('\n\n');
}
