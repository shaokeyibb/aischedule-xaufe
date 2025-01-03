async function scheduleTimer() {
  await loadTool("AIScheduleTools");

  await AIScheduleAlert(
    "导入完成！接下来您还可前往小爱课程表设置页手动设置开学时间。"
  );

  window.running = false;

  return {
    totalWeek: 16,
    startSemester: Date.now().toString(),
    startWithSunday: false,
    showWeekend: false,
    forenoon: 4,
    afternoon: 4,
    night: 2,
    sections: [
      {
        section: 1,
        startTime: "08:00",
        endTime: "08:50",
      },
      {
        section: 2,
        startTime: "09:00",
        endTime: "09:50",
      },
      {
        section: 3,
        startTime: "10:10",
        endTime: "11:00",
      },
      {
        section: 4,
        startTime: "11:10",
        endTime: "12:00",
      },
      {
        section: 5,
        startTime: "14:10",
        endTime: "15:00",
      },
      {
        section: 6,
        startTime: "15:10",
        endTime: "16:00",
      },
      {
        section: 7,
        startTime: "16:10",
        endTime: "17:00",
      },
      {
        section: 8,
        startTime: "17:10",
        endTime: "17:50",
      },
      {
        section: 9,
        startTime: "18:00",
        endTime: "18:50",
      },
      {
        section: 10,
        startTime: "19:00",
        endTime: "19:50",
      },
    ],
  };
}
