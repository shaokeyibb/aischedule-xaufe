async function scheduleHtmlProvider() {
  await loadTool("AIScheduleTools");

  if (window.running === true) {
    await AIScheduleAlert("导入工具正在运行中，无需重复点击导入按钮！");
    return "do not continue";
  }

  window.running = true;

  function isInSSOPage() {
    return window.location.hostname === "cas.xaufe.edu.cn";
  }

  function isInJwglPage() {
    return window.location.hostname === "jwgl.xaufe.edu.cn";
  }

  function isInEntryPoint() {
    return isInJwglPage() && window.location.pathname === "/sso/ddlogin";
  }

  function waitUntil(func) {
    return new Promise((resolve) => {
      const intervalID = setInterval(() => {
        if (func()) {
          clearInterval(intervalID);
          resolve();
        }
      }, 500);
    });
  }

  waitUntil(() => !isInEntryPoint());

  if (isInSSOPage()) {
    await AIScheduleAlert(
      "欢迎使用西安财经大学教务系统课程表导入工具！请先使用您的学号和密码登录到统一身份认证系统。"
    );
  }

  await waitUntil(isInJwglPage);

  function getTerm() {
    const month = new Date().getMonth();
    // 1 月至 8 月为第二学期
    if (month >= 0 && month <= 7) {
      return 2;
    }
    // 否则为第一学期
    return 1;
  }

  function getYear() {
    const year = new Date().getFullYear();
    return getTerm() === 1 ? year : year - 1;
  }

  const years = Object.fromEntries(
    Array.from(new Array(getYear() + 1).keys())
      .slice(1970)
      .reverse()
      .map((year) => {
        return [`${year}-${year + 1}`, year];
      })
  );

  const terms = {
    1: "3",
    2: "12",
    3: "16",
  };

  let selectedYear = `${getYear()}-${getYear() + 1}`;
  let selectedTerm = getTerm();

  const shouldSkipSelect = await AIScheduleConfirm({
    titleText: "直接导入本学期课表？",
    contentText: `如选择“是”，将直接导入 ${selectedYear} 学年第 ${selectedTerm} 学期课表，如希望导入其他学年/学期课表请选择“否”`,
    cancelText: "否",
    confirmText: "是",
  });

  if (!shouldSkipSelect) {
    selectedYear = await AIScheduleSelect({
      titleText: "请选择查询的学年",
      contentText: `本学年为：${getYear()}-${getYear() + 1}`,
      selectList: Object.keys(years),
    });

    selectedTerm = await AIScheduleSelect({
      titleText: "请选择查询的学期",
      contentText: `本学期为：${getTerm()}`,
      selectList: Object.keys(terms),
    });
  }

  let useClassCourseAPI = false;
  let res;

  try {
    res = await fetch("/jwglxt/kbcx/xskbcx_cxXsgrkb.html", {
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        xnm: years[selectedYear],
        xqm: terms[selectedTerm],
        kzlx: "ck",
        xsdm: "",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw {
        message: `error when fetch /jwglxt/kbcx/xskbcx_cxXsgrkb.html, status: ${res.statusText}(${res.status})`,
      };
    }
  } catch (e) {
    console.error(e);

    await AIScheduleAlert(
      `请求教务系统服务器时出现了一个问题：${e.message}，请稍后再试一次。`
    );

    useClassCourseAPI = await AIScheduleConfirm({
      titleText: "改用班级课表重试？",
      contentText:
        "在向教务系统服务器请求个人课表信息时出现了问题，要使用班级课表接口重新请求吗？在一些固定时段，这可能会解决问题。",
      cancelText: "取消",
      confirmText: "确认",
    });

    if (!useClassCourseAPI) {
      window.running = false;
      return "do not continue";
    }
  }

  if (useClassCourseAPI) {
    try {
      res = await fetch(
        "/jwglxt/kbdy/bjkbdy_cxBjkbdyIndex.html?gnmkdm=N214505&layout=default",
        {
          signal: AbortSignal.timeout(3000),
        }
      );
      if (!res.ok) {
        throw {
          message: `error when fetch /jwglxt/kbdy/bjkbdy_cxBjkbdyIndex, status: ${res.statusText}(${res.status})`,
        };
      }
      let params = Object.fromEntries(
        [
          ...document
            .createRange()
            .createContextualFragment(await res.text())
            .querySelectorAll("form#ajaxForm select"),
        ].map((param) => [
          param.name,
          param.selectedOptions === undefined ||
            param.selectedOptions[0] === undefined
            ? ""
            : param.selectedOptions[0].value,
        ])
      );
      params = {
        ...params,
        tjkbzdm: 1,
        tjkbzxsdm: 0,
        xnmc: selectedTerm,
        xqmmc: selectedYear,
        xnm: years[selectedYear],
        xqm: terms[selectedTerm],
      };

      res = await fetch("/jwglxt/kbdy/bjkbdy_cxBjKb.html", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams(params),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw {
          message: `error when fetch /jwglxt/kbdy/bjkbdy_cxBjKb.html, status: ${res.statusText}(${res.status})`,
        };
      }
    } catch (e) {
      console.error(e);

      await AIScheduleAlert(
        `请求教务系统服务器时出现了一个问题：${e.message}，请稍后再试一次。`
      );

      window.running = false;
      return "do not continue";
    }
  }

  const courseInfos = await res.json();

  if (courseInfos.kbList.length === 0) {
    
    await AIScheduleAlert({
      titleText: '找不到课程信息',
      contentText: '您选定的学年学期无课程，可能是教务尚未同步或您选错了学年学期。'
    })

    window.running = false;
    return "do not continue";
  }

  return JSON.stringify({
    courseInfos,
    metadata: {
      year: getYear(),
      term: getTerm(),
    },
  });
}
