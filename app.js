async function getCompletion(text) {

    const apiUrl = "https://api.openai.com/v1/chat/completions";
  
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: text,
        max_tokens: 100
      })
    });
  
    const data = await response.json();
    return data.choices[0].text;
  }

  async function generate() {
    const prompt = document.getElementById("prompt").value;
    const output = document.getElementById("output");
  
    if (!prompt) return;
  
    const completion = await getCompletion(prompt);
    output.innerText = completion;
  }

  const apiKeyScreen = document.getElementById('api-key-screen');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKeySubmit = document.getElementById('api-key-submit');
  const startScreen = document.getElementById('start-screen');
  const gameUI = document.getElementById('game-ui');
  const dialogueText = document.getElementById('dialogue-text');
  const optionsDiv = document.getElementById('keyword-options');
  const endButton = document.getElementById('end-button');

  let userApiKey = ''; // 사용자가 입력한 API 키를 저장할 변수
  let storyText = "미대생이 대학교에서 야작을 하고 있습니다."; // 초기 스토리 시작
  let objectionCount = 0;
  const maxObjections = 5;
  let passageCount = 0; 
  const maxPassages = 3; 
  let keywordSelections = 0; 

  // API 키를 입력받아 저장
apiKeySubmit.addEventListener('click', () => {
    userApiKey = apiKeyInput.value.trim();
    if (userApiKey) {
      apiKeyScreen.style.display = 'none';
      startScreen.style.display = 'block';
    } else {
      alert('API Key를 입력해주세요.');
    }
  });

  // API 키 제출 함수
function submitApiKey() {
    userApiKey = apiKeyInput.value.trim();
    if (userApiKey) {
      // 시작 화면과 API 입력 창을 숨김
      apiKeyScreen.style.display = 'none';
      startScreen.style.display = 'none';
      // 게임 UI를 보이게 설정
      gameUI.style.display = 'block';
    } else {
      alert('API Key를 입력해주세요.');
    }
  }
  
  // 버튼 클릭 시 API 키 제출
  apiKeySubmit.addEventListener('click', submitApiKey);
  
  // 엔터 키로 API 키 제출
  apiKeyInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      submitApiKey();
    }
  });

// GPT-4o 미니 API 호출
async function continueStory(prompt) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey}` // 사용자가 입력한 API 키 사용
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: "너는 이야기꾼이야. 독자가 보기에 아주 흥미로운 이야기를 장르를 가리지 않고 풀어내는게 네 일이야." }, { role: "user", content: prompt }],
          max_tokens: 100,
          n: 1,
          stop: null,
          temperature: 0.7
        })
      });
  
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Story generation error: ", error);
      return "스토리를 불러오는데 문제가 발생했습니다.";
    }
    }

    // 키워드 무작위 생성 요청
    async function generateRandomKeywords() {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userApiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "system", content: "세 가지 단어 키워드를 무작위로 생성해줘." }],
              max_tokens: 50,
              n: 1,
              stop: null,
              temperature: 0.7
            })
          });
      
          const data = await response.json();
          const keywordText = data.choices[0].message.content;
          return keywordText.split(',').slice(0, 3); // 키워드를 3개로 제한하고 배열로 반환
        } catch (error) {
          console.error("Keyword generation error: ", error);
          return ["문제 발생", "재시도", "오류"]; // 오류 발생 시 기본 키워드 반환
        }
      }
  
  // 키워드 선택지 표시
  async function showKeywordOptions() {
    const keywords = await generateRandomKeywords(); // AI로부터 키워드 생성
    optionsDiv.innerHTML = ''; // 기존 키워드 제거
    keywords.forEach((keyword) => {
      const button = document.createElement('button');
      button.innerText = keyword.trim(); // 키워드 버튼 생성
      button.onclick = () => chooseKeyword(keyword.trim()); // 각 버튼이 하나의 키워드를 선택
      optionsDiv.appendChild(button); // 각 키워드마다 개별 버튼 생성
    });
    optionsDiv.style.display = 'flex'; // 키워드 선택지 버튼들을 flex로 표시
  }
  
  // 키워드 선택 후 이야기 전개
  async function chooseKeyword(keyword) {
    storyText += `\n\n선택된 키워드: ${keyword}`;
    dialogueText.innerText = `선택된 키워드: ${keyword}로 이야기가 계속됩니다...`;
    const newStory = await continueStory(storyText + ` 선택된 키워드: ${keyword}`);
    storyText += "\n" + newStory;
    dialogueText.innerText = newStory;
    optionsDiv.style.display = 'none';
    keywordSelections++;
  
    // 3번 키워드를 선택하면 추가 문장 3개 생성 후 "마무리" 버튼 표시
    if (keywordSelections === 3) {
      for (let i = 0; i < 3; i++) {
        const additionalStory = await continueStory(storyText);
        storyText += "\n" + additionalStory;
        dialogueText.innerText = additionalStory;
      }
      endButton.style.display = 'block'; // 마무리 버튼 표시
    }
  
    passageCount = 0; // 대사 넘길 횟수 초기화
  }
  
  // 대사 넘기기 기능
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && passageCount < maxPassages) {
      const nextPassage = await continueStory(storyText);
      dialogueText.innerText = nextPassage;
      storyText += "\n" + nextPassage;
      passageCount++;
      if (passageCount === maxPassages) {
        // 대사를 다 넘겼으면 키워드 선택 화면으로 전환
        showKeywordOptions(generateRandomKeywords());
      }
    }
  });
  
  // 게임 시작 화면에서 Enter 누르면 게임 시작
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && startScreen.style.display !== 'none') {
      startScreen.style.display = 'none';
      gameUI.style.display = 'block';
    }
  });
  
  // 마무리 버튼 클릭 시 스토리 요약 창 표시
  endButton.onclick = () => {
    const summaryWindow = window.open("", "Story Summary", "width=600,height=400");
    summaryWindow.document.write("<h1>스토리 요약</h1><pre>" + storyText + "</pre>");
    summaryWindow.document.close();
  };