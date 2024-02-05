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

describe('People partner is able to create Scorecard Template', () => {
    beforeEach(async () => {
        await browser.url(`https://qa-automation.devmars2.star.global/`);
    
        await $('[name="username"]').setValue(username);
        await $('[name="password"]').setValue(process.env.UNIVERSAL_PASSWORD);
        await $('[data-testid="sign-in-with-creds-button"]').click();
        await $('[data-testid="header-tool-bar"]').waitForDisplayed();
        await $("button=Create Review Cycle").click();
        await $('[data-testid="name-field"] input').setValue("Autotest New Cycle Vasyl")
        await $('[data-testid="start-at-field"] input').setValue(dayjs().format("MM/DD/YYYY"))
        await $('[data-testid="end-at-field"] input').setValue(dayjs().add(3, "days").format("MM/DD/YYYY"))
        await $('[data-testid="submit-cycle-creation-button"]').click();
        await $("button=Reset All Filters").click();
        await $('[role="progressbar"]').waitForDisplayed({reverse: true, timeout: 30000})
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

      it('Create Scorecard Template', async () => {
        await $('[data-testid="review-cycle-multiselect"] input').doubleClick()
        await browser.keys('Delete')
        await $('[data-testid="review-cycle-multiselect"] input').setValue("Autotest New Cycle Vasyl")
        console.log("Text field: ", await $('[data-testid="review-cycle-multiselect"] input').getValue())
        await browser.keys('ArrowDown')
        await browser.keys('Enter')
        await $('//a[contains(@href, "scorecard-templates")]').click()
        await $('[data-testid="page-title"]').waitForDisplayed()
        await $('[data-testid="scorecard-name-field"] input').setValue('QA Department')
        await $('[data-testid="department-autocomplete"] input').setValue('ENG QA')
        await browser.keys('ArrowDown')
        await browser.keys('Enter')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').setValue('Automation internship')
        await $('[data-testid="goal-weight-field"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="goal-weight-field"] input').setValue('100')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').setValue('Complete homework 2')
        await $('[data-testid="subgoal-weight-field"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="subgoal-weight-field"] input').setValue('100')
        await $('//button[text()="Create"]').click()
        await expect($('[data-testid="page-title"]')).toHaveText('Edit Scorecard Template')
        await $('//button[text()="Back"]').click()
        await $('[data-testid="template-item-name"]').waitForDisplayed({reverse: false, timeout: 30000})
        await expect($('[data-testid="template-item-name"]')).toHaveText('QA Department')
      });
});

describe.only('People partner is able to edit Scorecard Template', () => {
    beforeEach( async () => {
        await browser.url(`https://qa-automation.devmars2.star.global/`);
    
        await $('[name="username"]').setValue(username);
        await $('[name="password"]').setValue(process.env.UNIVERSAL_PASSWORD);
        await $('[data-testid="sign-in-with-creds-button"]').click();
        await $('[data-testid="header-tool-bar"]').waitForDisplayed();
        await $("button=Create Review Cycle").click();
        await $('[data-testid="name-field"] input').setValue("Autotest New Cycle Vasyl")
        await $('[data-testid="start-at-field"] input').setValue(dayjs().format("MM/DD/YYYY"))
        await $('[data-testid="end-at-field"] input').setValue(dayjs().add(3, "days").format("MM/DD/YYYY"))
        await $('[data-testid="submit-cycle-creation-button"]').click();
        await $("button=Reset All Filters").click();
        await $('[role="progressbar"]').waitForDisplayed({reverse: true, timeout: 30000})
        await $('[data-testid="review-cycle-multiselect"] input').doubleClick()
        await browser.keys('Delete')
        await $('[data-testid="review-cycle-multiselect"] input').setValue("Autotest New Cycle Vasyl")
        console.log("Text field: ", await $('[data-testid="review-cycle-multiselect"] input').getValue())
        await browser.keys('ArrowDown')
        await browser.keys('Enter')
        await $('//a[contains(@href, "scorecard-templates")]').click()
        await $('[data-testid="page-title"]').waitForDisplayed()
        await $('[data-testid="scorecard-name-field"] input').setValue('QA Department')
        await $('[data-testid="department-autocomplete"] input').setValue('ENG QA')
        await browser.keys('ArrowDown')
        await browser.keys('Enter')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').setValue('Automation internship')
        await $('[data-testid="goal-weight-field"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="goal-weight-field"] input').setValue('100')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').setValue('Complete homework 2')
        await $('[data-testid="subgoal-weight-field"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="subgoal-weight-field"] input').setValue('100')
        await $('//button[text()="Create"]').click()
        await expect($('[data-testid="page-title"]')).toHaveText('Edit Scorecard Template')
        await $('//button[text()="Back"]').click()
        await $('[data-testid="template-item-name"]').waitForDisplayed({reverse: false, timeout: 30000})
        await expect($('[data-testid="template-item-name"]')).toHaveText('QA Department')
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

    it('Edit ScoreCard template', async () => {
        await $('[data-testid="edit-template-button"]').click()
        await $('[data-testid="scorecard-name-field"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="scorecard-name-field"] input').setValue('QA Department EDITED')
        await $('[data-testid="department-autocomplete"] input').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('[data-testid="department-autocomplete"] input').setValue('ENG Web BE')
        await browser.keys('ArrowDown')
        await browser.keys('Enter')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="goal-name-field"]//textarea)[1]').setValue('Automation internship Edited')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[1]').setValue('Complete homework 2 Edited')
        await $('(//div[@data-testid="subgoal-weight-field"]//input)[1]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-weight-field"]//input)[1]').setValue('50')
        await $('(//button[@data-testid="add-subgoal-button"])[1]').click()
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[3]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-name-field"]//textarea)[3]').setValue('COPY Complete homework 2 Edited')
        await $('(//div[@data-testid="subgoal-weight-field"]//input)[2]').click()
        await browser.keys(['Command', 'a'])
        await browser.keys('Delete')
        await $('(//div[@data-testid="subgoal-weight-field"]//input)[2]').setValue('50')
        await $('//button[text()="Save"]').click()
        await expect($('[role="presentation"]')).toBeDisplayed()
        await expect($('[role="presentation"] div:nth-of-type(2)')).toHaveText('Changes saved successfully')
        await $('//button[text()="Back"]').click()
        await $('[data-testid="template-item-name"]').waitForDisplayed({reverse: false, timeout: 30000})
        await expect($('[data-testid="template-item-name"]')).toHaveText('QA Department EDITED')
        await expect($('[data-testid="template-item-department"] span')).toHaveText('ENG WEB BE')
        await expect($('(//div[@data-testid="template-card-goal-item"]//span)[1]')).toHaveText('AUTOMATION INTERNSHIP EDITED')
        await expect($('((//li[@data-testid="template-card-subgoal-list-item"])[1]/span)[1]')).toHaveText('Complete homework 2 Edited')
        await expect($('((//li[@data-testid="template-card-subgoal-list-item"])[2]/span)[1]')).toHaveText('COPY Complete homework 2 Edited')
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

async function deleteString(element) {
    const string = await element.getText()
    for (let i=0; i < string.length; i++) {
        await browser.keys('Delete')
    }
}