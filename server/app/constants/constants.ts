/** This file is a directory of all constants used in the server */
export const ERRORS = {
    noIndexFound: -1,
};

export const FACTORS = {
    firstChoice: 0.2,
};

export const CHAR_SETS = {
    token: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-+=@#$%?&*()_',
};

export const LENGTHS = {
    token: 10,
};

export const NAMES = {
    manager: 'Organisateur',
    tester: 'Testeur',
};

export const QUESTION_TYPE = {
    qcm: 'QCM',
    qrl: 'QRL',
};

export enum SocketsSubscribeEvents {
    JoinMatch = 'joinMatchRoom',
    SendMessage = 'sendMessage',
    SwitchQuestion = 'switchQuestion',
    UpdateAnswer = 'updateAnswer',
    StartTimer = 'startTimer',
    StopTimer = 'stopTimer',
    CancelGame = 'cancelGame',
    FinishMatch = 'finishMatch',
    BeginMatch = 'beginMatch',
    RemovePlayer = 'removePlayer',
    UpdateScore = 'updatePlayerScore',
    SetFinalAnswer = 'setFinalAnswer',
    PlayerLeftAfterMatchBegun = 'playerLeftAfterMatchBegun',
    SendChartData = 'sendChartData',
    BeginQrlEvaluation = 'beginQrlEvaluation',
    FinishQrlEvaluation = 'finishQrlEvaluation',
    PanicModeActivated = 'panicModeActivated',
    ChangeChatAccessibility = 'changeChatAccessibility',
    HistogramTime = 'histogramTime',
}

export enum SocketsEmitEvents {
    NewPlayer = 'newPlayer',
    ChatMessage = 'chatMessage',
    NextQuestion = 'nextQuestion',
    AnswerUpdated = 'answerUpdated',
    NewTime = 'newTime',
    GameCanceled = 'gameCanceled',
    MatchFinished = 'matchFinished',
    JoinBegunMatch = 'joinMatch',
    PlayerRemoved = 'playerRemoved',
    UpdatedScore = 'updatedPlayerScore',
    FinalAnswerSet = 'finalAnswerSet',
    PlayerDisabled = 'playerDisabled',
    AllPlayersResponded = 'allPlayersResponded',
    UpdateChartDataList = 'updateChartDataList',
    QrlEvaluationBegun = 'qrlEvaluationBegun',
    QrlEvaluationFinished = 'qrlEvaluationFinished',
    PanicModeActivated = 'panicModeActivated',
    ChatAccessibilityChanged = 'chatAccessibilityChanged',
    HistogramTime = 'histogramTime',
}

export enum Passwords {
    DeleteAllMatches = 'Team205',
}
