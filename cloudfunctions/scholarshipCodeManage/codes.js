const scholarshipSeedVersion = '20260326-tiered-v1'
const scholarshipEligibleActivityIds = ['ai-camp-2026-copy']
const scholarshipLabel = '新学员奖学金兑换码'
const interviewFeeDiscountAmount = 50000
const defaultScholarshipAmount = 200000
const defaultScholarshipDiscountAmount = defaultScholarshipAmount + interviewFeeDiscountAmount

const buildScholarshipDescription = (scholarshipAmount) => {
  const scholarshipYuan = Math.floor(Number(scholarshipAmount || 0) / 100)
  const interviewFeeDiscountYuan = Math.floor(interviewFeeDiscountAmount / 100)
  return `奖学金¥${scholarshipYuan} + 面试抵扣¥${interviewFeeDiscountYuan}`
}

const createCodeDocs = (batchId, scholarshipAmount, codes) => {
  const normalizedScholarshipAmount = Math.floor(Number(scholarshipAmount) || 0)
  const discountAmount = normalizedScholarshipAmount + interviewFeeDiscountAmount
  return codes.map((code) => ({
    code,
    batchId,
    scholarshipAmount: normalizedScholarshipAmount,
    interviewFeeDiscountAmount,
    discountAmount,
    label: scholarshipLabel,
    description: buildScholarshipDescription(normalizedScholarshipAmount),
    initialStatus: 'unused'
  }))
}

const initialScholarshipCodeDocs = [
  ...createCodeDocs('20260326-tier-1500', 150000, [
    'CDVZN',
    'DUFEUF',
    'CFAYH',
    'HRGCH',
    'BNVML',
    'LDLLVH',
    'NTFFQ',
    'JRHDZ',
    'QYQWCQ',
    'CNUVXN',
    'KXQFZW',
    'NGMWJK',
    'XFSGSH',
    'CEBHKL',
    'HGPMKE',
    'DFPQL',
    'DBFPQG',
    'TGASR',
    'QFDUYF',
    'EBRNZ',
    'JSJZXW',
    'QPCCGG',
    'TNUAY',
    'SLALUB',
    'JNWEBP',
    'MYNQRV',
    'ULBLTK',
    'CMNZAR',
    'DUBSB',
    'LTJSL'
  ]),
  ...createCodeDocs('20260326-tier-1000', 100000, [
    'NDNUHU',
    'BLAFJ',
    'HYGCQZ',
    'PXVXM',
    'LTCMW',
    'SLSVR',
    'RWNTBV',
    'LRRAPS',
    'NVNTGQ',
    'VAHJF',
    'KEXTS',
    'LWLYTU',
    'KGTQK',
    'SGAKZY',
    'FVMFYQ',
    'JDFRA',
    'TXVGHZ',
    'HUTAVG',
    'FDVGXQ',
    'GKNQSZ',
    'JCNNAB',
    'HMBUUA',
    'WPJEY',
    'VYNXKP',
    'GBYJUL',
    'WMUTV',
    'XCYZAS',
    'FFQEPP',
    'AABAE',
    'RWEXZE'
  ]),
  ...createCodeDocs('20260326-tier-500', 50000, [
    'BUHXT',
    'KSEGSZ',
    'QCAPER',
    'AHMQU',
    'EYMMYS',
    'QVQVFH',
    'WQHVMH',
    'MTDCH',
    'JTSKY',
    'ZBCAYS',
    'QGFLF',
    'JJCVJ',
    'JPFGSS',
    'NTJTY',
    'FQEWWH',
    'KAXZPT',
    'GCMWPF',
    'QGCWF',
    'JHGUE',
    'YCLJE',
    'PYYBT',
    'LNWWCZ',
    'MYSHWJ',
    'JAKREH',
    'QQXTB',
    'ZJQLPU',
    'ZECLUR',
    'AGQEHZ',
    'VAXXBL',
    'KFYAX'
  ])
]

module.exports = {
  scholarshipSeedVersion,
  scholarshipEligibleActivityIds,
  scholarshipLabel,
  interviewFeeDiscountAmount,
  defaultScholarshipAmount,
  defaultScholarshipDiscountAmount,
  buildScholarshipDescription,
  initialScholarshipCodeDocs
}
