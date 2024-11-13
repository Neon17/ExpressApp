class ApiFeature {
    constructor(query,queryStr){
        this.query = query;
        this.queryStr = queryStr;
    }
    filter(){
        let queryString = JSON.stringify(this.queryStr);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g,(match)=>`$${match}`);
        let queryObj = JSON.parse(queryString);
        //we have to exclude sort,limit,page,fields otherwise it may result in 0 data
        for (const[key,value] of Object.entries(queryObj)){
            if ((key=='limit')||(key=='page')||(key=='fields')||(key=='sort'))
                delete(queryObj[key]);
        }
        this.query = this.query.find(queryObj);
        return this;
    }
    sort(){
        if (this.queryStr.sort){
            const sortby = this.queryStr.sort.split(',').join(' ');
            this.query = this.query.sort(sortby);
        }
        else {
            this.query = this.query.sort('-created_at');
        }
        return this;
    }
    limitFields(){
        if (this.queryStr.fields){
            const fields = this.queryStr.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        else {
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate(){
        if (this.queryStr.page){
            // const count = this.query.countDocuments();
            const pages = this.queryStr.pages*1 || 1;
            const limit = this.queryStr.limit*1 || 1;
            const skip = (pages-1)*limit;
            // if (skip>=count)
            //     throw new Error("This page is not found!");
            this.query = this.query.skip(skip).limit(limit);
        }
        return this;
    }
}
module.exports = ApiFeature;