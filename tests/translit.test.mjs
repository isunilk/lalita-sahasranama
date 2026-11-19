import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toScript, toIAST } from '../src/lib/translit.mjs';

const eq = (a, b) => assert.equal(a.normalize('NFC'), b.normalize('NFC'));

test('IAST', () => {
  eq(toIAST('चिदग्निकुण्डसम्भूता'), 'Cidagnikuṇḍasambhūtā');
  eq(toIAST('ॐ श्रीमात्रे नमः'), 'Oṃ Śrīmātre Namaḥ');
  eq(toIAST('मनस्', { capitalize: false }), 'manas');
});

test('Telugu and Kannada use anusvara before a consonant of the same class', () => {
  eq(toScript('चिदग्निकुण्डसम्भूता', 'te'), 'చిదగ్నికుండసంభూతా');
  eq(toScript('पञ्चतन्मात्रसायका', 'kn'), 'ಪಂಚತನ್ಮಾತ್ರಸಾಯಕಾ');
});

test('Tamil', () => {
  eq(toScript('श्रीमाता', 'ta'), 'ஸ்ரீமாதா');
  eq(toScript('श्रीमत्सिंहासनेश्वरी', 'ta'), 'ஸ்ரீமத்ஸிம்ஹாஸனேஶ்வரீ');
  eq(toScript('ॐ श्रीमात्रे नमः', 'ta'), 'ஓம் ஸ்ரீமாத்ரே நமஹ');
});

test('Malayalam chillu and anusvara', () => {
  eq(toScript('चतुर्बाहुसमन्विता', 'ml'), 'ചതുർബാഹുസമന്വിതാ');
  eq(toScript('चिदग्निकुण्डसम्भूता', 'ml'), 'ചിദഗ്നികുണ്ഡസംഭൂതാ');
});

test('Bengali va, ya and khanda-ta', () => {
  eq(toScript('श्रीमत्सिंहासनेश्वरी', 'bn'), 'শ্রীমৎসিংহাসনেশ্বরী');
  eq(toScript('पञ्चतन्मात्रसायका', 'bn'), 'পঞ্চতন্মাত্রসায়কা');
  eq(toScript('चतुर्बाहुसमन्विता', 'bn'), 'চতুর্বাহুসমন্বিতা');
});

test('Odia ya and wa', () => {
  eq(toScript('देवकार्यसमुद्यता', 'or'), 'ଦେବକାର୍ଯ୍ୟସମୁଦ୍ୟତା');
  eq(toScript('श्रीमत्सिंहासनेश्वरी', 'or'), 'ଶ୍ରୀମତ୍ସିଂହାସନେଶ୍ୱରୀ');
});

test('Avagraha', () => {
  eq(toIAST('वयोऽवस्थाविवर्जिता'), 'Vayo’vasthāvivarjitā');
  eq(toScript('वयोऽवस्थाविवर्जिता', 'ta'), 'வயோவஸ்தாவிவர்ஜிதா');
  eq(toScript('वयोऽवस्थाविवर्जिता', 'te'), 'వయోఽవస్థావివర్జితా');
});

test('Gujarati and Om signs', () => {
  eq(toScript('ॐ चिदग्निकुण्डसम्भूतायै नमः', 'gu'), 'ૐ ચિદગ્નિકુંડસંભૂતાયૈ નમઃ');
  eq(toScript('ॐ श्रीमात्रे नमः', 'te'), 'ఓం శ్రీమాత్రే నమః');
});
