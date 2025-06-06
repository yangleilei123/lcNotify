// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const date = event.date

  const res = await db.collection('signInRecords').where({
    openid: openid,
    date: date
  }).get()

  return {
    isSigned: res.data.length > 0
  }
}