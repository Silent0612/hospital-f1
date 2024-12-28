<template>
  <div class="drug-list">
    <div class="header">
      <h2>处方列表</h2>
      <el-input
        v-model="searchQuery"
        placeholder="请输入患者姓名或预约号搜索"
        class="search-input"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table :data="prescriptionList" style="width: 100%" border>
      <el-table-column prop="id" label="预约编号" width="120" />
      <el-table-column prop="user_name" label="患者姓名" width="120" />
      <el-table-column prop="diagnose_result" label="诊断结果" width="200" />
      <el-table-column prop="prescription" label="处方信息" width="300" />
      <el-table-column prop="drugStatus" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.drugStatus === '待取药' ? 'warning' : 'success'">
            {{ scope.row.drugStatus || '待取药' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="handleDispenseDrugs(scope.row)"
            :disabled="scope.row.drugStatus === '已取药'"
          >
            发药
          </el-button>
          <el-button
            type="info"
            size="small"
            @click="viewDetails(scope.row)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 发药确认对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="发药确认"
      width="50%"
    >
      <div class="prescription-details">
        <h3>处方详情</h3>
        <div class="detail-item">
          <span class="label">患者姓名：</span>
          <span>{{ currentPrescription.user_name || '未知' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">诊断结果：</span>
          <span>{{ currentPrescription.diagnose_result || '暂无诊断' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">处方信息：</span>
          <span>{{ currentPrescription.prescription || '暂无处方' }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDispense">
            确认发药
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'DrugList',
  components: {
    Search
  },
  setup() {
    const prescriptionList = ref([])
    const searchQuery = ref('')
    const dialogVisible = ref(false)
    const currentPrescription = ref({})

    const fetchPrescriptions = async () => {
      try {
        // 获取所有已诊断的预约
        const response = await axios.get('/api/appointments/doctor/33')
        if (response.data.code === 200) {
          prescriptionList.value = response.data.data.filter(item => 
            item.diagnose_result || item.prescription
          ).map(item => ({
            ...item,
            userName: item.user_name || '未知患者',
            diagnoseResult: item.diagnose_result || '暂无诊断',
            prescription: item.prescription || '暂无处方',
            drugStatus: item.drugStatus || '待取药'
          }))
        } else {
          ElMessage.error(response.data.msg || '获取数据失败')
        }
      } catch (error) {
        console.error('获取处方列表失败:', error)
        ElMessage.error('获取处方列表失败，请检查后端服务是否正常运行')
      }
    }

    const handleSearch = () => {
      if (!searchQuery.value) {
        fetchPrescriptions()
        return
      }
      const query = searchQuery.value.toLowerCase()
      prescriptionList.value = prescriptionList.value.filter(item => 
        item.user_name?.toLowerCase().includes(query) || 
        item.id?.toString().includes(query)
      )
    }

    const handleDispenseDrugs = (row) => {
      currentPrescription.value = row
      dialogVisible.value = true
    }

    const confirmDispense = async () => {
      try {
        await axios.put(`/api/appointments/${currentPrescription.value.id}`, {
          ...currentPrescription.value,
          drugStatus: '已取药'
        })
        // 更新本地状态
        const index = prescriptionList.value.findIndex(item => item.id === currentPrescription.value.id)
        if (index !== -1) {
          prescriptionList.value[index].drugStatus = '已取药'
        }
        ElMessage.success('发药成功')
        dialogVisible.value = false
      } catch (error) {
        console.error('发药确认失败:', error)
        ElMessage.error('发药确认失败，请稍后重试')
      }
    }

    const viewDetails = (row) => {
      currentPrescription.value = row
      ElMessageBox.alert(
        `
        患者姓名：${row.user_name || '未知'}
        预约编号：${row.id}
        诊断结果：${row.diagnose_result || '暂无诊断'}
        处方信息：${row.prescription || '暂无处方'}
        取药状态：${row.drugStatus || '待取药'}
        `,
        '处方详情',
        {
          confirmButtonText: '确定'
        }
      )
    }

    onMounted(() => {
      fetchPrescriptions()
    })

    return {
      prescriptionList,
      searchQuery,
      dialogVisible,
      currentPrescription,
      handleSearch,
      handleDispenseDrugs,
      confirmDispense,
      viewDetails
    }
  }
}
</script>

<style scoped>
.drug-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.prescription-details {
  padding: 20px;
}

.detail-item {
  margin: 10px 0;
}

.label {
  font-weight: bold;
  margin-right: 10px;
}
</style> 