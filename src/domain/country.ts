const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  AO: 'Angola',
  BJ: 'Benin',
  BW: 'Botswana',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  CM: 'Cameroon',
  CV: 'Cape Verde',
  CF: 'Central African Republic',
  TD: 'Chad',
  KM: 'Comoros',
  CG: 'Republic of the Congo',
  CD: 'Democratic Republic of the Congo',
  DJ: 'Djibouti',
  EG: 'Egypt',
  GQ: 'Equatorial Guinea',
  ER: 'Eritrea',
  SZ: 'Eswatini',
  ET: 'Ethiopia',
  GA: 'Gabon',
  GM: 'Gambia',
  GH: 'Ghana',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  CI: "Cote d'Ivoire",
  KE: 'Kenya',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  MG: 'Madagascar',
  MW: 'Malawi',
  ML: 'Mali',
  MR: 'Mauritania',
  MU: 'Mauritius',
  MA: 'Morocco',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NE: 'Niger',
  NG: 'Nigeria',
  RW: 'Rwanda',
  ST: 'Sao Tome and Principe',
  SN: 'Senegal',
  SC: 'Seychelles',
  SL: 'Sierra Leone',
  SO: 'Somalia',
  ZA: 'South Africa',
  SS: 'South Sudan',
  SD: 'Sudan',
  TZ: 'Tanzania',
  TG: 'Togo',
  TN: 'Tunisia',
  UG: 'Uganda',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  US: 'United States',
  GB: 'United Kingdom',
  IN: 'India',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  CA: 'Canada',
  MX: 'Mexico',
  AU: 'Australia',
  NZ: 'New Zealand',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
};

const COUNTRY_ALIASES: Array<[string, string]> = [
  ['united states of america', 'US'],
  ['united states', 'US'],
  ['usa', 'US'],
  ['uk', 'GB'],
  ['united kingdom', 'GB'],
  ['great britain', 'GB'],
  ['south korea', 'KR'],
  ['republic of korea', 'KR'],
  ['ivory coast', 'CI'],
  ["cote d'ivoire", 'CI'],
  ['democratic republic of the congo', 'CD'],
  ['dr congo', 'CD'],
  ['republic of the congo', 'CG'],
  ['congo brazzaville', 'CG'],
  ['sao tome and principe', 'ST'],
  ['cape verde', 'CV'],
  ['eswatini', 'SZ'],
  ['swaziland', 'SZ'],
  ['south sudan', 'SS'],
  ['angola', 'AO'],
  ['benin', 'BJ'],
  ['botswana', 'BW'],
  ['burkina faso', 'BF'],
  ['burundi', 'BI'],
  ['cameroon', 'CM'],
  ['central african republic', 'CF'],
  ['chad', 'TD'],
  ['comoros', 'KM'],
  ['djibouti', 'DJ'],
  ['egypt', 'EG'],
  ['equatorial guinea', 'GQ'],
  ['eritrea', 'ER'],
  ['ethiopia', 'ET'],
  ['gabon', 'GA'],
  ['gambia', 'GM'],
  ['ghana', 'GH'],
  ['guinea bissau', 'GW'],
  ['guinea', 'GN'],
  ['kenya', 'KE'],
  ['lesotho', 'LS'],
  ['liberia', 'LR'],
  ['libya', 'LY'],
  ['madagascar', 'MG'],
  ['malawi', 'MW'],
  ['mali', 'ML'],
  ['mauritania', 'MR'],
  ['mauritius', 'MU'],
  ['morocco', 'MA'],
  ['mozambique', 'MZ'],
  ['namibia', 'NA'],
  ['niger', 'NE'],
  ['nigeria', 'NG'],
  ['rwanda', 'RW'],
  ['senegal', 'SN'],
  ['seychelles', 'SC'],
  ['sierra leone', 'SL'],
  ['somalia', 'SO'],
  ['south africa', 'ZA'],
  ['sudan', 'SD'],
  ['tanzania', 'TZ'],
  ['togo', 'TG'],
  ['tunisia', 'TN'],
  ['uganda', 'UG'],
  ['zambia', 'ZM'],
  ['zimbabwe', 'ZW'],
  ['india', 'IN'],
  ['france', 'FR'],
  ['germany', 'DE'],
  ['spain', 'ES'],
  ['italy', 'IT'],
  ['brazil', 'BR'],
  ['canada', 'CA'],
  ['mexico', 'MX'],
  ['australia', 'AU'],
  ['new zealand', 'NZ'],
  ['japan', 'JP'],
  ['china', 'CN'],
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCountryNameByCode(countryCode: string): string {
  const normalizedCode = countryCode.toUpperCase();
  return COUNTRY_CODE_TO_NAME[normalizedCode] ?? normalizedCode;
}

export function findCountryIdInText(text: string): string | undefined {
  const normalizedText = normalize(text);

  for (const [alias, code] of COUNTRY_ALIASES) {
    const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`);
    if (pattern.test(normalizedText)) {
      return code;
    }
  }

  const shortCodeMatch = normalizedText.match(/\bfrom\s+([a-z]{2})\b/);
  if (!shortCodeMatch) {
    return undefined;
  }

  const normalizedCode = shortCodeMatch[1].toUpperCase();
  if (COUNTRY_CODE_TO_NAME[normalizedCode]) {
    return normalizedCode;
  }

  return undefined;
}
