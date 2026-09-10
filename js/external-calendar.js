// ====================================================
// EXTERNAL-CALENDAR.JS — 구글/네이버/애플 캘린더 원클릭 연동 모듈
// ====================================================

/**
 * 데이트 카드 데이터를 바탕으로 시작 일시/종료 일시 Date 객체 계산
 */
export function getCalendarEventTime(cardData) {
  const dateStr = cardData.d || new Date().toISOString().split('T')[0];
  let startTimeStr = '12:00';

  if (cardData.c && Array.isArray(cardData.c) && cardData.c.length > 0 && cardData.c[0].tm) {
    startTimeStr = cardData.c[0].tm;
  }

  // 시작 일시 파싱 (YYYY-MM-DD + HH:mm)
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const start = new Date(dateStr);
  start.setHours(hours || 12, minutes || 0, 0, 0);

  // 종료 일시는 기본 3시간 후로 설정
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  return { start, end };
}

/**
 * 캘린더 이벤트 본문/내용 문자열 조합
 */
export function buildEventDetails(cardData) {
  const sender = cardData.s || '상대방';
  const receiver = cardData.r || '나';
  const area = cardData.a || '데이트 장소';
  const message = cardData.m || '';
  
  let coursesText = '';
  if (cardData.c && Array.isArray(cardData.c)) {
    coursesText = cardData.c
      .map((c, i) => `${i + 1}차: ${c.n || '장소'} (${c.t || '코스'}${c.tm ? ' ' + c.tm : ''})`)
      .join('\n');
  }

  return `💌 [DatePlanner] ${receiver} & ${sender}의 설레는 데이트 약속 💖\n\n` +
    `📍 만남 지역: ${area}\n` +
    (coursesText ? `\n[데이트 코스 동선]\n${coursesText}\n` : '') +
    (message ? `\n💌 전하는 마음:\n"${message}"\n` : '') +
    `\n✨ 초대장 다시 보기: ${window.location.href}`;
}

/**
 * 1. 구글 캘린더 등록 Web URL 생성
 */
export function generateGoogleCalendarUrl(cardData) {
  const { start, end } = getCalendarEventTime(cardData);
  const title = `💖 데이트 약속 (${cardData.s || ''} & ${cardData.r || ''})`;
  const location = cardData.a || '';
  const details = buildEventDetails(cardData);

  const formatGoogleTime = (d) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGoogleTime(start)}/${formatGoogleTime(end)}`,
    details: details,
    location: location,
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * 2. 네이버 캘린더 등록 Web URL 생성
 */
export function generateNaverCalendarUrl(cardData) {
  const { start, end } = getCalendarEventTime(cardData);
  const title = `💖 데이트 약속 (${cardData.s || ''} & ${cardData.r || ''})`;
  const location = cardData.a || '';
  const memo = buildEventDetails(cardData);

  const pad = (n) => String(n).padStart(2, '0');
  const formatNaverTime = (d) => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const params = new URLSearchParams({
    title: title,
    start: formatNaverTime(start),
    end: formatNaverTime(end),
    location: location,
    memo: memo
  });

  return `https://calendar.naver.com/action/calendar/new?${params.toString()}`;
}

/**
 * 3. 애플 / 기기 캘린더용 iCal (.ics) 파일 다운로드
 */
export function downloadICalendarFile(cardData) {
  const { start, end } = getCalendarEventTime(cardData);
  const title = `💖 데이트 약속 (${cardData.s || ''} & ${cardData.r || ''})`;
  const location = cardData.a || '';
  const description = buildEventDetails(cardData).replace(/\n/g, '\\n');

  const formatIcsTime = (d) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DatePlanner//Romantic Date Invitation//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:dateplanner-${Date.now()}@dateplanner.app`,
    `DTSTAMP:${formatIcsTime(new Date())}`,
    `DTSTART:${formatIcsTime(start)}`,
    `DTEND:${formatIcsTime(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `date-invitation-${cardData.d || 'schedule'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
