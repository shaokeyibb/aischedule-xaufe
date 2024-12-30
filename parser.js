function scheduleHtmlParser(data) {
  const { courseInfos } = JSON.parse(data);

  function readSections(course) {
    const regex = /(\d+)-(\d+)/.exec(course.jcs);

    return Array.from(
      { length: parseInt(regex[2]) - parseInt(regex[1]) + 1 },
      (_v, k) => k + parseInt(regex[1])
    );
  }

  function readWeeks(course) {
    const regex = /(\d+)-(\d+)周(\((单|双)\))?/.exec(course.zcd);

    let res = Array.from(
      { length: parseInt(regex[2]) - parseInt(regex[1]) + 1 },
      (_v, k) => k + parseInt(regex[1])
    );

    if (regex[4] === "单") {
      res = res.filter((it) => it % 2 === 1);
    } else if (regex[4] === "双") {
      res = res.filter((it) => it % 2 === 0);
    }

    return res;
  }

  const res = [];

  for (const course of courseInfos.kbList) {
    res.push({
      name: course.kcmc,
      position: `${course.xqmc}-${course.cdmc}`,
      teacher: course.xm,
      weeks: readWeeks(course),
      day: course.xqj,
      sections: readSections(course),
    });
  }

  return res;
}
