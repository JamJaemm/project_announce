// 패키지 가져오기
const express = require("express");
const jwt = require("jsonwebtoken");
// 스키마 가져오기
const { Users } = require("../models");
// 라우터 생성하기
const router = express.Router();

// 로그인
//                    비동기
router.post("/login", async (req, res) => {
  // 바디에서 id 와  password 를 객체 분해 할당 한다.
  const { id, password } = req.body;
  //           동기   모델  하나찾기           닉네임 일치

  const user = await Users.findOne({ where: { id } });

  // ID과 비밀번호가 유효한지 확인하기
  // 같은 ID가 없다면
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 ID입니다." });
  }
  // 같은 ID가 있지만 비밀번호가 다르다면
  else if (user.password !== password) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }
  // 위의 과정을 모두 통과 = 닉네임과 비밀번호가 유효하다면, 토큰을 생성한다.
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    "customized_secret_key" // 비밀키
  );
  //토큰을 쿠키로 만든다,      쿠키명      토큰
  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인 성공", userId: user.userId });
});

// 회원가입
// 클라이언트에서 준 정보 처리
router.post("/user", async (req, res) => {
  const { id, password, confirmPassword, name, message, nickname } = req.body;

  //  id 검증
  // 정규식을 활용하여, 입력받은 id가 조건을 만족하는지 체크한다.
  const idRegex = /^[A-Za-z0-9]+[A-Za-z0-9]{2,}$/g;
  const idCheck = idRegex.test(id);

  // 같은 id가 있는지 검색한다.
  const isExistUserID = await Users.findOne({ where: { id } });

  // 존재한다면 경고를 띄운다.
  if (isExistUserID) {
    return res.status(409).json({ message: "이미 존재하는 ID입니다.." });
  }
  
  // id가 조건을 만족하지 않는다면,
  if (!idCheck) {
    res.status(400).json({
      // 경고문을 띄운다.
      errorMessage:
        "ID를 최소 3자 이상, 알파벳 대소문자(a~z, A~Z), 숫자(0~9) 으로 작성하세요",
    });
    return;
  }

  //  비밀번호 검증
  // 6글자 이상 , 대문자 ~ 소문자 , 어떤 숫자든지 가능
  const passRegex = /^(?=.*[A-Za-z\d!@#$%^&*]).{6,20}$/
  const passCheck = passRegex.test(password);

  // 위의 조건 + id 를 포함하지 않을 것
  if (!passCheck || password.includes(id)) {
    res.status(400).json({
      errorMessage:
        "password는 ID를 포함하지 않는, 영어, 숫자, 특수문자(!@#$%^&*)를 포함한 6~20 글자여야합니다.",
    });
    return;
  }

  // 패스워드를 똑같이 두 번 입력하지 않은 경우 에러 메시지 출력
  if (password !== confirmPassword) {
    res.status(400).json({
      errorMessage: "비밀번호가 일치하지 않습니다..",
    });
    return;
  }

  //  한글 이름 검증
  const nameRegex = /^[가-힣]{2,}$/;
  const nameCheck = nameRegex.test(name);

  if (!nameCheck) {
    res.status(400).json({
      errorMessage:
        "이름은 두 글자 이상, 한글만 입력해주세요.",
    });
    return;
  }

  //  닉네임 검증

  if (!nickCheck) {
    res.status(400).json({
      errorMessage:
        "닉네임을 3~10자, 알파벳 대소문자(a~z, A~Z), 숫자(0~9) 으로 작성하세요",
    });
    return;
  }

  // 닉네임 중복 확인
  const isExistUserNickname = await Users.findOne({ where: { nickname } });

  // 존재한다면 경고를 띄운다.
  if (isExistUserNickname) {
    return res.status(409).json({ message: "이미 존재하는 닉네임입니다." });
  }

  // 메시지 검증    
  const messRegex = /^[A-Za-z\d!@#$%^&()[\]{}가-힣ㄱ-ㅎㅏ-ㅣ*_^.,';:　\s]{1,30}$/
  const messCheck = messRegex.test(message);

  if (!messCheck) {
    res.status(400).json({
      errorMessage:
        "메시지는 1~30 글자로 해주세요!(영어, 숫자, 특수문자만 가능)",
    });
    return;
  }

  const user = await Users.create({
    id,
    password,
    name,
    message,
    nickname,
  });

  return res.status(201).json({ message: "회원가입이 완료되었습니다." });
});

// 현재 라우터를 모듈로 내보낸다.
module.exports = router;
