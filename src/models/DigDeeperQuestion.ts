import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";
import {cloneDeep} from "lodash";

export enum DigDeeperQuestionType {
    ONBOARDING_DATA = 'ONBOARDING_DATA',
    PERSONALITY_INSIGHTS = 'PERSONALITY_INSIGHTS'
}

export enum DigDeeperQuestionStatus {
    PENDING = 'PENDING',
    ANSWERED = 'ANSWERED',
    SKIPPED = 'SKIPPED'
}

export interface IDigDeeperQuestion {
    question: string;
    question_type: DigDeeperQuestionType;
    context: string;
    status: DigDeeperQuestionStatus;
}

export interface DigDeeperQuestion extends IDigDeeperQuestion {
    id: string;
    user_id: string;
    answer?: string;
    created_at: string;
    updated_at: string;
}

export interface DigDeeperQuestions {
    [key: string]: DigDeeperQuestion;
}

// Create the observable state
export const digDeeperQuestions$ = observable<Nilable<DigDeeperQuestions>>(null);

// Helper function to get questions as an array
export function getDigDeeperQuestionsArray(): DigDeeperQuestion[] {
    const questions = digDeeperQuestions$.peek();
    if (!questions) return [];
    return Object.values(questions);
}

// Helper function to get pending questions
export function getPendingQuestions(): DigDeeperQuestion[] {
    return getDigDeeperQuestionsArray().filter(q => q.status === DigDeeperQuestionStatus.PENDING);
}

// Helper function to get answered questions
export function getAnsweredQuestions(): DigDeeperQuestion[] {
    return getDigDeeperQuestionsArray().filter(q => q.status === DigDeeperQuestionStatus.ANSWERED);
}

// This is here because we need to force the observable to update via reference pointer change
function getDigDeepQuestions(): DigDeeperQuestions {
    return cloneDeep(digDeeperQuestions$.peek()) ?? {}
}

// Helper function to update or add a question
export function upsertQuestion(question: DigDeeperQuestion): void {
    const questions = getDigDeepQuestions();
    questions[question.id] = question;
    digDeeperQuestions$.set(questions);
}

// Helper function to remove a question
export function removeQuestion(id: string): void {
    const questions = getDigDeepQuestions();
    if (!questions) return;
    
    const newQuestions = { ...questions };
    delete newQuestions[id];
    digDeeperQuestions$.set(newQuestions);
}

// Helper function to clear all questions
export function clearQuestions(): void {
    digDeeperQuestions$.set(null);
}

export function answerQuestion(id: string, answer: string): void {
    const values = getDigDeepQuestions();
    if (!values || !values[id]) return;
    
    const question = values[id];
    upsertQuestion({
        ...question,
        answer,
        status: DigDeeperQuestionStatus.ANSWERED,
        updated_at: new Date().toISOString()
    });
} 