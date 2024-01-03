import { QuestionChartData } from '@app/interfaces/questions-chart-data';
/**
 * Interface used in the update of the questions chart
 */
export interface UpdateChartDataRequest {
    matchAccessCode: string;
    questionChartData: QuestionChartData;
}
