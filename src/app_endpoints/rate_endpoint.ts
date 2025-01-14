import { RateLimiter } from "../utils/apiRateLimit";
import { GetDetailsFromNPM, parseFromGitLink } from "../utils/utils";
import * as LicenseRunner from "../url_list/licenseMetric/licenseRunner";
import * as BusFactorRunner from "../url_list/busFactorMetric/busFactorRunner";
import * as RampUpRunner from "../url_list/rampUpMetric/rampUpRunner";
import * as RespMaintRunner from "../url_list/respMaintMetric/respMaintRunner";
import * as CorrectnessRunner from "../url_list/correctnessMetric/correctnessRunner";
import * as PR_Runner from "../url_list/PR_metric/pull_request";
import * as Version_Pin_runner from "../url_list/versionPinningMetric/versionPinning"
import type { PackageRating } from "../utils/types";
import { Bus } from "../url_list/busFactorMetric/busFactor";

async function eval_single_file(urlstr: string): Promise<PackageRating> {
    let url: [string, string] = ["", ""];
    if (urlstr.startsWith("https://www.npmjs.com")) {
        url = await GetDetailsFromNPM(urlstr);
    } else {
        url = parseFromGitLink(urlstr);
    }
    const limiter = new RateLimiter();
    
    //LICENSE SCORE
    const licenseScore: number = await LicenseRunner.getLicenseScore(
    limiter,
    `/repos/${url[0]}/${url[1]}`
    );

    //RAMPUP SCORE
    const rampUpScore: number = await RampUpRunner.getRampUpScore(url);
    // const rampUpScore: number = 0;

    //BUSFACTOR SCORE
    let bus = new Bus();
    const busFactorScore: number = await bus.Bus_Factor(
    `/repos/${url[0]}/${url[1]}`
    );

    //RESPONSIVE MAINTAINER SCORE
    const maintainerScore: number = await RespMaintRunner.getRespMaintScore(
    url
    );

    //CORRECTNESS SCORE
    const correctnessScore: number = await CorrectnessRunner.getCorrectness(
    url
    );

    const pull_request_score: number = await PR_Runner.getPRscore(
    url
    );

    const version_pinning_score: number = await Version_Pin_runner.get_version_pin_score(
    url
    );
    //const version_pinning_score: number = 0.55;
    
    //OVERALL SCORE
    const multipliers = {
        license: 0.2,
        rampUp: 0.2,
        busFactor: 0.15,
        maintainer: 0.2,
        correctness: 0.2,
        pull_request: 0.025,
        version_pin: 0.025
    };

    const adjustedScores: { [x: string]: number } = {
        licenseScore: licenseScore,
        rampUpScore: rampUpScore,
        busFactorScore: busFactorScore,
        maintainerScore: maintainerScore,
        correctnessScore: correctnessScore,
        pullrequestScore: pull_request_score,
        VersionPinScore: version_pinning_score
    };

    for (const scoreName in adjustedScores) {
        if (adjustedScores.hasOwnProperty(scoreName)) {
            let currentScore = adjustedScores[scoreName];    
            currentScore = Math.max(0, Math.min(1, currentScore));
            if (currentScore < 0.5 && currentScore > 0.4) {
                currentScore += 0.1;
            }
            if (currentScore <= 0.4 && currentScore > 0.15) {
                currentScore += 0.35;
            }
            adjustedScores[scoreName] = Math.max(0, Math.min(1, currentScore));
        }
    }
    

    Object.entries(adjustedScores).forEach(([key, score]): any => {
    adjustedScores[key] =
        Math.round((score + Number.EPSILON) * 100000) / 100000;
    });

    var overallScore: number =
    Math.round(
        (
        multipliers.license * licenseScore +
        multipliers.rampUp * rampUpScore +
        multipliers.busFactor * busFactorScore +
        multipliers.maintainer * maintainerScore +
        multipliers.correctness * correctnessScore +
        multipliers.pull_request * pull_request_score +
        multipliers.version_pin * version_pinning_score +
        Number.EPSILON) *
        100000
    ) / 100000;

    const output = 
    {
        NetScore: overallScore,
        RampUp: adjustedScores.rampUpScore,
        Correctness: adjustedScores.correctnessScore,
        BusFactor: adjustedScores.busFactorScore,
        ResponsiveMaintainer: adjustedScores.maintainerScore,
        LicenseScore: adjustedScores.licenseScore,
        PullRequest: adjustedScores.pullrequestScore,
        GoodPinningPractice: adjustedScores.VersionPinScore
    };


    return output;

}

export { eval_single_file }