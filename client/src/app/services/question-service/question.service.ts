import { Injectable } from '@angular/core';
import { Question } from '@app/classes/question/question';
import { CHAR_SETS, LENGTHS, POINTS, QUESTION_TYPE } from '@app/constants/constants';
import { Choice } from '@app/interfaces/choice';

@Injectable({
    providedIn: 'root',
})
/**
 * Manages the question's list of a new game to create or a game that need to be modified
 */
export class QuestionService {
    questions: Question[] = [];
    errorMessages: string[] = [];

    resetQuestions(): void {
        this.questions = [];
    }

    getQuestionByIndex(index: number): Question {
        return this.questions[index];
    }

    /**
     * Add a question to the question's list after validating it or displays errors if the question isn't valid
     * @param Question question to add
     * @returns if the question was added successfully to the question's list
     */
    addQuestion(question: Question): boolean {
        if (this.validateQuestion(question)) {
            question.id = this.generateId(LENGTHS.questionId);
            this.questions.push(question);
            return true;
        } else {
            this.displayErrors();
            return false;
        }
    }

    /**
     * Displays the errors that caused the non validation of a question
     */
    displayErrors(): void {
        if (this.errorMessages.length > 0)
            window.alert(`L'enregistrement de la question a échoué à cause des erreurs suivantes : \n${this.errorMessages.join('\n')}`);
        this.errorMessages = [];
    }

    /**
     * Validates a question that needs to be updated or displays errors if the question isn't valid
     * @param Question question to validate
     * @returns if the question is valid
     */
    validateUpdatedQuestion(question: Question): boolean {
        if (this.validateQuestion(question)) return true;
        else {
            this.displayErrors();
            return false;
        }
    }

    /**
     * Cancels the modifications made on a question
     * @param previousQuestion question with the version of data to keep
     * @param index index of the question to keep in the questions list
     */
    cancelQuestionModification(previousQuestion: Question, index: number): void {
        if (this.questions.length > index) {
            this.questions[index] = previousQuestion;
        }
    }

    generateId(length: number): string {
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * CHAR_SETS.id.length);
            result += CHAR_SETS.id.charAt(randomIndex);
        }

        return result;
    }

    /**
     * Validate that question's informations respects the specificities
     * @param question question to validate
     * @returns if the question is valid
     */
    validateQuestion(question: Question): boolean {
        if (this.validateQuestionsInputs(question)) {
            if (question.type === QUESTION_TYPE.qcm) {
                return this.validateQcmAnswers(question.choices);
            } else if (question.type === QUESTION_TYPE.qrl) return true;
        }
        return false;
    }

    /**
     * Validates all questions if the questions list
     * @returns if all the question are valid
     */
    validateAllQuestions(): boolean {
        if (this.questions.length === 0) return false;
        return this.questions.every((question) => this.validateQuestion(question));
    }

    validateQuestionsInputs(question: Question): boolean {
        const pointsAreValid = this.validatePoints(question.points);
        if (!pointsAreValid) this.errorMessages.push('\n- Les points accordés à la question doivent être entre 10 et 100 points');

        const descriptionIsValid = this.validateTextField(question.text);
        if (!descriptionIsValid) this.errorMessages.push("\n- L'énoncé de la question est requis");

        const typeIsValid = question.type.toUpperCase() === QUESTION_TYPE.qcm || question.type.toUpperCase() === QUESTION_TYPE.qrl;
        if (!typeIsValid) this.errorMessages.push("\n- Le type de la question n'a pas été choisi");

        return typeIsValid && descriptionIsValid && pointsAreValid;
    }

    validatePoints(points: number): boolean {
        return points !== undefined && points <= POINTS.max && points >= POINTS.min;
    }

    validateTextField(textfield: string): boolean {
        return typeof textfield === 'string' && textfield !== undefined && textfield.trim() !== '';
    }

    validateQcmAnswers(choices: Choice[]): boolean {
        if (choices !== undefined && Array.isArray(choices) && choices.length !== 0) {
            const allChoicesTextsAreValid = choices.every((choice) => this.validateTextField(choice.text));
            if (!allChoicesTextsAreValid) this.errorMessages.push("\n- Le texte d'un ou plusieurs choix de réponse n'a pas été saisi");

            const choicesTextsAreDifferent = this.validateChoicesTexts(choices);
            if (!choicesTextsAreDifferent) this.errorMessages.push('\n- Chaque choix de réponse doit contenir une réponse unique');

            const hasAtLeastOneGoodChoice = this.hasGoodChoice(choices);
            if (!hasAtLeastOneGoodChoice) this.errorMessages.push('\n- La question doit avoir au moins une bonne réponse parmi les choix');

            const hasAtLeastOneBadChoice = this.hasBadChoice(choices);
            if (!hasAtLeastOneBadChoice) this.errorMessages.push('\n- La question doit avoir au moins une mauvaise réponse parmi les choix');

            return allChoicesTextsAreValid && choicesTextsAreDifferent && hasAtLeastOneGoodChoice && hasAtLeastOneBadChoice;
        } else {
            this.errorMessages.push('\n- La question doit contenir des choix de réponse');
            return false;
        }
    }

    hasGoodChoice(choices: Choice[]): boolean {
        return choices.some((choice) => choice.isCorrect);
    }

    hasBadChoice(choices: Choice[]): boolean {
        return choices.some((choice) => !choice.isCorrect);
    }

    validateChoicesTexts(choices: Choice[]): boolean {
        const uniqueChoicesTexts: string[] = [];
        choices.forEach((choice) => {
            if (!uniqueChoicesTexts.includes(choice.text)) uniqueChoicesTexts.push(choice.text);
        });
        return uniqueChoicesTexts.length === choices.length;
    }
}
