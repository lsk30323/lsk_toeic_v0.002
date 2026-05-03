export interface ToeicSentence {
  english: string;
  korean: string;
}

export interface ToeicAudioGroup {
  id: string;
  sentences: ToeicSentence[];
}

export const TOEIC_DATA: ToeicAudioGroup[] = [
  {
    id: "toeic_01_1",
    sentences: [
      { english: "She is wearing eyeglasses.", korean: "그녀는 안경을 쓰고 있습니다." },
      { english: "A woman is reading a book.", korean: "한 여자가 책을 읽고 있습니다." }
    ]
  },
  {
    id: "toeic_01_2",
    sentences: [
      { english: "Reading a book.", korean: "책을 읽고 있습니다." },
      { english: "Looking at a map.", korean: "지도를 보고 있습니다." },
      { english: "Looking in a drawer.", korean: "서랍 안을 들여다보고 있습니다." },
      { english: "Examining an item.", korean: "물건을 자세히 살펴보고 있습니다." },
      { english: "Browsing through merchandise.", korean: "상품을 둘러보고 있습니다." },
      { english: "Sitting on a bench.", korean: "벤치에 앉아 있습니다." },
      { english: "Standing behind a counter.", korean: "카운터 뒤에 서 있습니다." },
      { english: "Waiting in line.", korean: "줄을 서서 기다리고 있습니다." }
    ]
  },
  {
    id: "toeic_01_3",
    sentences: [
      { english: "She is looking into a bag.", korean: "그녀는 가방 안을 들여다보고 있습니다." }, // Removed "Number 1. A." to make it pure dictation sentence
      { english: "She is examining some clothing.", korean: "그녀는 옷을 살펴보고 있습니다." },
      { english: "Some people are waiting in line.", korean: "몇몇 사람들이 줄을 서서 기다리고 있습니다." },
      { english: "One of the men is moving some boxes.", korean: "남자들 중 한 명이 상자를 옮기고 있습니다." },
      { english: "They are looking in a drawer.", korean: "그들은 서랍 안을 들여다보고 있습니다." },
      { english: "A woman is sitting on a chair.", korean: "한 여자가 의자에 앉아 있습니다." },
      { english: "They're standing near a building.", korean: "그들은 건물 근처에 서 있습니다." },
      { english: "One of the men is talking on the phone.", korean: "남자들 중 한 명이 전화 통화를 하고 있습니다." },
      { english: "A woman is drinking from a cup.", korean: "한 여자가 컵으로 음료를 마시고 있습니다." },
      { english: "A woman is reading in an armchair.", korean: "한 여자가 안락의자에서 책을 읽고 있습니다." }
    ]
  },
  {
    id: "toeic_01_4",
    sentences: [
      { english: "Typing on a keyboard.", korean: "키보드를 치고 있습니다." },
      { english: "Serving food.", korean: "음식을 서빙하고 있습니다." },
      { english: "Preparing some food.", korean: "음식을 준비하고 있습니다." },
      { english: "Pushing a wheelbarrow.", korean: "손수레를 밀고 있습니다." },
      { english: "Adjusting some equipment.", korean: "장비를 조정하고 있습니다." },
      { english: "Cleaning a window.", korean: "창문을 닦고 있습니다." },
      { english: "Wearing a jacket.", korean: "재킷을 입고 있습니다." },
      { english: "Holding a cup.", korean: "컵을 들고 있습니다." },
      { english: "Carrying a briefcase.", korean: "서류 가방을 들고 나르고 있습니다." },
      { english: "Walking on a street.", korean: "길을 걷고 있습니다." },
      { english: "Crossing a street.", korean: "길을 건너고 있습니다." },
      { english: "Walking up some stairs.", korean: "계단을 걸어 올라가고 있습니다." },
      { english: "Walking down the stairs.", korean: "계단을 걸어 내려가고 있습니다." },
      { english: "Facing each other.", korean: "서로 마주 보고 있습니다." },
      { english: "Leaning against a wall.", korean: "벽에 기대어 있습니다." },
      { english: "Reaching for an item.", korean: "물건을 향해 손을 뻗고 있습니다." },
      { english: "Removing an item.", korean: "물건을 치우고 있습니다." },
      { english: "Bending over some boxes.", korean: "상자들 위로 몸을 숙이고 있습니다." },
      { english: "Boarding a train.", korean: "기차에 탑승하고 있습니다." },
      { english: "Getting on a bus.", korean: "버스에 타고 있습니다." },
      { english: "Riding a bicycle.", korean: "자전거를 타고 있습니다." }
    ]
  },
  {
    id: "toeic_01_6",
    sentences: [
      { english: "He's standing on some grass.", korean: "그는 잔디 위에 서 있습니다." },
      { english: "He's putting on a helmet.", korean: "그는 헬멧을 쓰고 있는 중입니다." },
      { english: "He's climbing a ladder.", korean: "그는 사다리를 오르고 있습니다." },
      { english: "He's painting a wall.", korean: "그는 벽에 페인트칠을 하고 있습니다." },
      { english: "A woman is watering some flowers.", korean: "한 여자가 꽃에 물을 주고 있습니다." },
      { english: "A woman is writing on a notepad.", korean: "한 여자가 수첩에 글을 쓰고 있습니다." },
      { english: "The woman is picking up packages.", korean: "여자가 소포를 집어 들고 있습니다." },
      { english: "The woman is putting shoes in the bag.", korean: "여자가 가방에 신발을 넣고 있습니다." },
      { english: "The woman is trying on shoes.", korean: "여자가 신발을 신어보고 있습니다." },
      { english: "She's sweeping a walkway.", korean: "그녀는 보도를 쓸고 있습니다." },
      { english: "She's trimming some bushes.", korean: "그녀는 덤불을 다듬고 있습니다." },
      { english: "They're shaking hands.", korean: "그들은 악수를 하고 있습니다." },
      { english: "They're walking on a path.", korean: "그들은 오솔길을 걷고 있습니다." },
      { english: "They're carrying some plants.", korean: "그들은 식물을 나르고 있습니다." },
      { english: "They're entering a building.", korean: "그들은 건물에 들어가고 있습니다." },
      { english: "One of the women is holding onto a railing.", korean: "여자들 중 한 명이 난간을 붙잡고 있습니다." },
      { english: "A man is sitting by a window.", korean: "한 남자가 창가에 앉아 있습니다." },
      { english: "A man is opening a laptop computer.", korean: "한 남자가 노트북 컴퓨터를 열고 있습니다." },
      { english: "Some people are attending a performance.", korean: "몇몇 사람들이 공연에 참석하고 있습니다." },
      { english: "A woman is speaking to a group of people.", korean: "한 여자가 무리의 사람들에게 말하고 있습니다." },
      { english: "A man is repairing a fence.", korean: "한 남자가 울타리를 수리하고 있습니다." },
      { english: "A man is leaning against a railing.", korean: "한 남자가 난간에 기대어 있습니다." },
      { english: "A man is standing on a ladder.", korean: "한 남자가 사다리 위에 서 있습니다." },
      { english: "A man is arranging some chairs.", korean: "한 남자가 의자들을 배열하고 있습니다." },
      { english: "A man is cleaning some dishes.", korean: "한 남자가 접시들을 닦고 있습니다." },
      { english: "She's removing an item from a shelf.", korean: "그녀는 선반에서 물건을 치우고 있습니다." },
      { english: "She's placing an item into a basket.", korean: "그녀는 물건을 바구니에 넣고 있습니다." },
      { english: "She's paying for some groceries.", korean: "그녀는 식료품 값을 지불하고 있습니다." },
      { english: "She is setting a table.", korean: "그녀는 상을 차리고 있습니다." },
      { english: "She is placing a vase on a table.", korean: "그녀는 테이블 위에 꽃병을 놓고 있습니다." }
    ]
  },
  {
    id: "toeic_02_1",
    sentences: [
      { english: "Boxes are stacked.", korean: "상자들이 쌓여 있습니다." },
      { english: "Boxes have been stacked.", korean: "상자들이 쌓여 있습니다." },
      { english: "A potted plant is on the desk.", korean: "화분이 책상 위에 있습니다." },
      { english: "There is a potted plant on the desk.", korean: "책상 위에 화분이 있습니다." }
    ]
  },
  {
    id: "toeic_02_3",
    sentences: [
      { english: "Bags are displayed on the shelves.", korean: "가방들이 선반 위에 진열되어 있습니다." },
      { english: "The shelves have been filled with items.", korean: "선반들이 물건들로 가득 차 있습니다." },
      { english: "The tables are occupied.", korean: "테이블들이 차지되어 있습니다." },
      { english: "Monitors are positioned side by side.", korean: "모니터들이 나란히 배치되어 있습니다." },
      { english: "Cushions have been arranged on a couch.", korean: "쿠션들이 소파 위에 배열되어 있습니다." },
      { english: "Some artwork has been mounted on the wall.", korean: "미술품 몇 점이 벽에 걸려 있습니다." },
      { english: "A potted plant has been placed in the corner.", korean: "화분이 구석에 놓여 있습니다." },
      { english: "Some garden tools are propped against the wall.", korean: "정원 도구 몇 개가 벽에 기대어 세워져 있습니다." },
      { english: "Some stairs lead to the beach.", korean: "계단이 해변으로 이어져 있습니다." },
      { english: "Trees have been planted around the house.", korean: "나무들이 집 주변에 심어져 있습니다." },
      { english: "There's a fountain in front of a building.", korean: "건물 앞에 분수가 있습니다." },
      { english: "Some boats are docked at a pier.", korean: "보트 몇 척이 부두에 정박해 있습니다." },
      { english: "Cars are parked in a row.", korean: "차들이 한 줄로 주차되어 있습니다." }
    ]
  }
];

export const ALL_TOEIC_SENTENCES = TOEIC_DATA.flatMap(group => group.sentences);
