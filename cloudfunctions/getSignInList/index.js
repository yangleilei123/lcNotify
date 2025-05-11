// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { date } = event
  const wxContext = cloud.getWXContext()

  try {
    // 获取签到记录
    const signInRes = await db.collection('signInRecords').where({
      date: date
    }).get()

    const signedOpenids = signInRes.data.map(item => item.openid)

    // 获取所有用户信息
    const allUsersRes = await db.collection('users').get()
    const allUserInfos = allUsersRes.data

    const signedUserInfos = allUserInfos.filter(user => signedOpenids.includes(user.openid))
    const unsignedUserInfos = allUserInfos.filter(user => !signedOpenids.includes(user.openid))

    // 获取所有头像的临时访问链接
    const fileIDs = allUserInfos.map(user => user.avatarUrl).filter(url => url)
    let tempFileURLMap = {}
    
    if (fileIDs.length > 0) {
      const tempFileURLRes = await cloud.getTempFileURL({
        fileList: fileIDs
      })
      tempFileURLMap = tempFileURLRes.fileList.reduce((map, file) => {
        map[file.fileID] = file.tempFileURL
        return map
      }, {})
    }

    // 组合签到列表，使用临时访问链接
    const combinedList = [
      ...signedUserInfos.map(user => ({ 
        nickname: user.nickName, 
        status: '已签到',
        avatarUrl: tempFileURLMap[user.avatarUrl] || user.avatarUrl
      })),
      ...unsignedUserInfos.map(user => ({ 
        nickname: user.nickName, 
        status: '未签到',
        avatarUrl: tempFileURLMap[user.avatarUrl] || user.avatarUrl
      }))
    ]

    return {
      success: true,
      list: combinedList
    }
  } catch (error) {
    console.error('获取签到列表失败：', error)
    return {
      success: false,
      error: error
    }
  }
}