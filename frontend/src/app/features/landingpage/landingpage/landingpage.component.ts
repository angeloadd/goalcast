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
            title: 'Predict Results',
            description: 'Call the score for every match. See who gets it right.',
        },
        {
            icon: 'bootstrapPeople',
            title: 'Invite Friends',
            description: 'Create a league, share a link, and compete against your crew.',
        },
        {
            icon: 'bootstrapLightning',
            title: 'Bonus Predictions',
            description: 'Predict scorers and the tournament winner for extra points.',
        },
        {
            icon: 'bootstrapSliders',
            title: 'Customize Your League',
            description: 'Set prediction timeframes, enable bonus rules, and play your way.',
        },
    ];

    steps = [
        {
            title: 'Create a League',
            description: 'Pick a tournament, set the rules, and name your league.',
        },
        {
            title: 'Invite Friends',
            description: 'Share the link or send email invites.',
        },
        {
            title: 'Predict Scores',
            description: 'Submit your predictions before kickoff.',
        },
        {
            title: 'Climb the Ranking',
            description: 'Earn points and see who comes out on top.',
        },
    ];
}
