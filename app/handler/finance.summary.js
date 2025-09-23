import {successResponse} from "../../infrastructure/rest/response.js";
import financeSummaryService from "../service/finance.summary.js";

const fetchFinanceSummary = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id ?? null,
    }

    const summary = await financeSummaryService.fetchFinanceSummary(param)
    res.status(200).json(successResponse("successfully fetch finance summary", summary))
}

export default {
    fetchFinanceSummary,
}