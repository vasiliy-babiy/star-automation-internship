const { expect, browser, $ } = require("@wdio/globals");
const dayjs = require("dayjs");
import axios from "axios";

const baseApiUrl = "https://qa-automation.devmars2.star.global/api/"
const username = "mzarudnieva"

describe("Login to Mars", () => {
  afterEach(async () => {
    await browser.reloadSession();
  });

  it("login with valid credentials", async () => {
    await browser.url(`https://qa-automation.devmars2.star.global/`);

    await $('[name="username"]').setValue(username);
    await $('[name="password"]').setValue(process.env.UNIVERSAL_PASSWORD);
    await $('[data-testid="sign-in-with-creds-button"]').click();

    await $('[data-testid="header-tool-bar"]').waitForDisplayed();

    const displayed = await $('[data-testid="LogoutIcon"]').isDisplayed();
    await expect(displayed).toBeTruthy();
  });
});

describe("User is logged in", () => {
  beforeEach(async () => {
    await browser.url(`https://qa-automation.devmars2.star.global/`);

    await $('[name="username"]').setValue(username);
    await $('[name="password"]').setValue(process.env.UNIVERSAL_PASSWORD);
    await $('[data-testid="sign-in-with-creds-button"]').click();
    await $('[data-testid="header-tool-bar"]').waitForDisplayed();
  });

  afterEach(async () => {
    const token = await getAuthToken(username, process.env.UNIVERSAL_PASSWORD),
    header = await getRequestHeader(token),
    cycleIds = await getCycleIds(header)

    if(cycleIds.length > 0) {
        await Promise.all(cycleIds.map((id) => deleteCycle(header, id)))
    }
    
    await browser.reloadSession();
  });

  it("People Partner user is able to create a cycle", async () => {
    await $("button=Create Review Cycle").click();
    await $('[data-testid="name-field"] input').setValue("Autotest New Cycle Vasyl")
    await $('[data-testid="start-at-field"] input').setValue(dayjs().format("MM/DD/YYYY"))
    await $('[data-testid="end-at-field"] input').setValue(dayjs().add(3, "days").format("MM/DD/YYYY"))
    await $('[data-testid="submit-cycle-creation-button"]').click();
    await $("button=Reset All Filters").click();
    await $('[role="progressbar"]').waitForDisplayed({reverse: true, timeout: 30000})

    const cycleNames = await $$('[data-testid="cycle-item-name"]');
    let names = [];
    for (const cycle of cycleNames) {
      names.push(await cycle.getText());
    }
    await expect(names.includes("Autotest New Cycle Vasyl")).toBeTruthy();
  });

  it('Verify Review Cycle list', async () => {
    const mockApi = await browser.mock(`${baseApiUrl}review-cycle/full-list**`, {method: 'GET'})
    await mockApi.respond (
        {
            "items": [{
                "id": 910,
                "name": "TEST123",
                "startAt": "2023-12-04T22:00:00.000Z",
                "endAt": "2023-12-05T22:00:00.000Z",
                "status": "draft",
                "scorecardTemplates": []
            }],
            "pagination": {
                "page": 1,
                "limit": 30,
                "total": 34
            }
        }, {
            statusCode: 200
        }
    )

    await browser.url("https://qa-automation.devmars2.star.global/review-cycles/list")
    await $('[data-testid="header-tool-bar"]').waitForDisplayed();
    await expect($('[data-testid="cycle-item-name"]')).toHaveText("TEST123")
    await expect($$('[data-testid="cycle-item-name"]')).toBeElementsArrayOfSize(1)

  });
});

function getAuthToken(username, password) {
    const url = `${baseApiUrl}auth/login/universal`,
    data = {
        "username": username,
        "password": process.env.UNIVERSAL_PASSWORD
    }
    return axios.post(url, data)
}

function getRequestHeader(tokenResponse) {
    return {
        headers: {
            "Cookie": `token=${tokenResponse.data.auth.token}`,
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br"
        }
    }
}

async function deleteCycle(header, cycleId) {
    const url = `${baseApiUrl}review-cycle/${cycleId}`,
    response = await axios.delete(url, header)
    await expect(response.status).toBe(200)
    return response
}

async function getCycles(header) {
    const url = `${baseApiUrl}review-cycle/options/review-cycles`,
    response = await axios.get(url, header)
    await expect(response.status).toBe(200)
    return response
}

async function getCycleIds(header, name = "Autotest New Cycle Vasyl") {
    const cycles = await getCycles(header),
    list = cycles.data.items.filter(cycle => cycle.name.includes(name))
    return list.map(cycle => cycle.id)
}