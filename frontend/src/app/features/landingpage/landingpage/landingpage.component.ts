import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    bootstrapArrowRight,
    bootstrapBullseye,
    bootstrapLightning,
    bootstrapPeople,
    bootstrapShieldShaded,
    bootstrapSliders,
    bootstrapTrophy,
} from '@ng-icons/bootstrap-icons';

@Component({
    selector: 'gc-landingpage',
    imports: [RouterLink, NgIcon],
    templateUrl: './landingpage.component.html',
    styleUrl: './landingpage.component.scss',
    host: { class: 'flex flex-col' },
    viewProviders: [
        provideIcons({
            bootstrapTrophy,
            bootstrapBullseye,
            bootstrapPeople,
            bootstrapLightning,
            bootstrapSliders,
            bootstrapShieldShaded,
            bootstrapArrowRight,
        }),
    ],
})
export class LandingpageComponent {
    features = [
        {
            icon: 'bootstrapBullseye',
            title: $localize`:@@feature.predictResults.title:Predict Results`,
            description: $localize`:@@feature.predictResults.desc:Call the score for every match. See who gets it right.`,
        },
        {
            icon: 'bootstrapPeople',
            title: $localize`:@@feature.inviteFriends.title:Invite Friends`,
            description: $localize`:@@feature.inviteFriends.desc:Create a league, share a link, and compete against your crew.`,
        },
        {
            icon: 'bootstrapLightning',
            title: $localize`:@@feature.bonusPredictions.title:Bonus Predictions`,
            description: $localize`:@@feature.bonusPredictions.desc:Predict scorers and the tournament winner for extra points.`,
        },
        {
            icon: 'bootstrapSliders',
            title: $localize`:@@feature.customizeLeague.title:Customize Your League`,
            description: $localize`:@@feature.customizeLeague.desc:Set prediction timeframes, enable bonus rules, and play your way.`,
        },
    ];

    steps = [
        {
            title: $localize`:@@step.createLeague.title:Create a League`,
            description: $localize`:@@step.createLeague.desc:Pick a tournament, set the rules, and name your league.`,
        },
        {
            title: $localize`:@@step.inviteFriends.title:Invite Friends`,
            description: $localize`:@@step.inviteFriends.desc:Share the link or send email invites.`,
        },
        {
            title: $localize`:@@step.predictScores.title:Predict Scores`,
            description: $localize`:@@step.predictScores.desc:Submit your predictions before kickoff.`,
        },
        {
            title: $localize`:@@step.climbRanking.title:Climb the Ranking`,
            description: $localize`:@@step.climbRanking.desc:Earn points and see who comes out on top.`,
        },
    ];
}