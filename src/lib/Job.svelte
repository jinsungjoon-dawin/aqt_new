<script>
    import { onMount } from "svelte";

    // MariaDB Types
    const mariaDBTypes = [
        "VARCHAR",
        "CHAR",
        "TEXT",
        "LONGTEXT",
        "INT",
        "BIGINT",
        "DECIMAL",
        "FLOAT",
        "DOUBLE",
        "DATE",
        "DATETIME",
        "TIMESTAMP",
        "TIME",
        "BOOLEAN",
        "JSON",
    ];

    // 1. Mock Data - Jobs
    // status: 'R' (Read/Existing), 'N' (New), 'D' (Deleted), 'U' (Updated - optional)
    let jobs = [
        {
            job_id: 1,
            job_code: "NSBCO0755S02",
            job_desc: "수신 조회 전문 Sample",
            status: "R",
        },
    ];

    // 2. Mock Data - Job Items
    let allItems = [
        // Root Items
        {
            item_id: 1,
            job_id: 1,
            item_code: "CommHeader",
            parent_item_code: null,
            item_order: 1,
            status: "R",
        },
        {
            item_id: 2,
            job_id: 1,
            item_code: "Message",
            parent_item_code: null,
            item_order: 2,
            status: "R",
        },
        {
            item_id: 3,
            job_id: 1,
            item_code: "NSBCO0755S02_8000200002_O",
            parent_item_code: null,
            item_order: 3,
            status: "R",
        },

        // Children of Message
        {
            item_id: 4,
            job_id: 1,
            item_code: "MessageData",
            parent_item_code: "Message",
            item_order: 4,
            status: "R",
        },
        // Children of MessageData
        {
            item_id: 5,
            job_id: 1,
            item_code: "msg_data",
            parent_item_code: "MessageData",
            item_order: 5,
            status: "R",
        },

        // Children of NSBCO0755S02_8000200002_O
        {
            item_id: 6,
            job_id: 1,
            item_code: "DataHeader",
            parent_item_code: "NSBCO0755S02_8000200002_O",
            item_order: 6,
            status: "R",
        },
        {
            item_id: 7,
            job_id: 1,
            item_code: "DataBody",
            parent_item_code: "NSBCO0755S02_8000200002_O",
            item_order: 7,
            status: "R",
        },

        // Children of DataHeader
        {
            item_id: 8,
            job_id: 1,
            item_code: "form_list",
            parent_item_code: "DataHeader",
            item_order: 8,
            status: "R",
        },
    ];

    // 3. Mock Data - Job Item Fields
    // field_id, field_name, item_id, field_type, field_length, field_desc, field_order, masking, default, null_yn, status
    let allFields = [
        // 1. CommHeader
        {
            field_id: 1,
            item_id: 1,
            field_order: 1,
            field_name: "msg_len",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 2,
            item_id: 1,
            field_order: 2,
            field_name: "glob_id",
            field_type: "VARCHAR",
            field_length: 32,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 3,
            item_id: 1,
            field_order: 3,
            field_name: "recv_svc_c",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 4,
            item_id: 1,
            field_order: 4,
            field_name: "rst_recv_svc_c",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 5,
            item_id: 1,
            field_order: 5,
            field_name: "rqst_resp_g",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 6,
            item_id: 1,
            field_order: 6,
            field_name: "chan_u",
            field_type: "VARCHAR",
            field_length: 5,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 7,
            item_id: 1,
            field_order: 7,
            field_name: "client_ip_no",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 8,
            item_id: 1,
            field_order: 8,
            field_name: "client_mac",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 9,
            item_id: 1,
            field_order: 9,
            field_name: "grpco_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 10,
            item_id: 1,
            field_order: 10,
            field_name: "msg_snd_msg_ilsi",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 11,
            item_id: 1,
            field_order: 11,
            field_name: "sync_g",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 12,
            item_id: 1,
            field_order: 12,
            field_name: "eai_trx_g",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 13,
            item_id: 1,
            field_order: 13,
            field_name: "ttl_use_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 14,
            item_id: 1,
            field_order: 14,
            field_name: "fst_sttim",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 15,
            item_id: 1,
            field_order: 15,
            field_name: "keep_times",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 16,
            item_id: 1,
            field_order: 16,
            field_name: "snd_infc_g",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 17,
            item_id: 1,
            field_order: 17,
            field_name: "msg_snd_g",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 18,
            item_id: 1,
            field_order: 18,
            field_name: "trm_set_brno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 19,
            item_id: 1,
            field_order: 19,
            field_name: "trm_set_trmno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 20,
            item_id: 1,
            field_order: 20,
            field_name: "trm_tong_no",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 21,
            item_id: 1,
            field_order: 21,
            field_name: "trxbrno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 22,
            item_id: 1,
            field_order: 22,
            field_name: "trx_trmno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 23,
            item_id: 1,
            field_order: 23,
            field_name: "op_keyno",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 24,
            item_id: 1,
            field_order: 24,
            field_name: "op_hwnno",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 25,
            item_id: 1,
            field_order: 25,
            field_name: "bbk_prntr_link_g",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 26,
            item_id: 1,
            field_order: 26,
            field_name: "trm_recv_ga_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 27,
            item_id: 1,
            field_order: 27,
            field_name: "aprvr_cnt",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 28,
            item_id: 1,
            field_order: 28,
            field_name: "aprvr_keyno1",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 29,
            item_id: 1,
            field_order: 29,
            field_name: "aprvr_hwnno1",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 30,
            item_id: 1,
            field_order: 30,
            field_name: "filler2",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 31,
            item_id: 1,
            field_order: 31,
            field_name: "aprvr_keyno2",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 32,
            item_id: 1,
            field_order: 32,
            field_name: "aprvr_hwnno2",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 33,
            item_id: 1,
            field_order: 33,
            field_name: "filler3",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 34,
            item_id: 1,
            field_order: 34,
            field_name: "mgaf_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 35,
            item_id: 1,
            field_order: 35,
            field_name: "msg_u",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 36,
            item_id: 1,
            field_order: 36,
            field_name: "mach_set_grpco_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 37,
            item_id: 1,
            field_order: 37,
            field_name: "scr_id",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 38,
            item_id: 1,
            field_order: 38,
            field_name: "msg_hdr_mdia_ctnt",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 39,
            item_id: 1,
            field_order: 39,
            field_name: "target_svc_trx_c",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 40,
            item_id: 1,
            field_order: 40,
            field_name: "upmu_stt_c",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 41,
            item_id: 1,
            field_order: 41,
            field_name: "msg_wrt_lan_g",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 42,
            item_id: 1,
            field_order: 42,
            field_name: "trm_lock_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 43,
            item_id: 1,
            field_order: 43,
            field_name: "snd_node_ctnt",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 44,
            item_id: 1,
            field_order: 44,
            field_name: "serv_mng_brno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 45,
            item_id: 1,
            field_order: 45,
            field_name: "frnt_g",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 46,
            item_id: 1,
            field_order: 46,
            field_name: "trx_op_sosok_grpco_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 47,
            item_id: 1,
            field_order: 47,
            field_name: "trx_aprvr_sosok_grpco_c1",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 48,
            item_id: 1,
            field_order: 48,
            field_name: "trx_aprvr_sosok_grpco_c2",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 49,
            item_id: 1,
            field_order: 49,
            field_name: "async_atrb",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 50,
            item_id: 1,
            field_order: 50,
            field_name: "form_occr_g",
            field_type: "VARCHAR",
            field_length: 1,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 51,
            item_id: 1,
            field_order: 51,
            field_name: "oprt_brno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 52,
            item_id: 1,
            field_order: 52,
            field_name: "scr_prctc_mode",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 53,
            item_id: 1,
            field_order: 53,
            field_name: "scr_prctc_snr_no",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 54,
            item_id: 1,
            field_order: 54,
            field_name: "scr_prctc_action_no",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 55,
            item_id: 1,
            field_order: 55,
            field_name: "std_msg_hdr_g",
            field_type: "VARCHAR",
            field_length: 2,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 56,
            item_id: 1,
            field_order: 56,
            field_name: "out_msg_ilsi",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 57,
            item_id: 1,
            field_order: 57,
            field_name: "rst_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 58,
            item_id: 1,
            field_order: 58,
            field_name: "out_u",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 59,
            item_id: 1,
            field_order: 59,
            field_name: "msg_cont_no",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 60,
            item_id: 1,
            field_order: 60,
            field_name: "err_sys",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 61,
            item_id: 1,
            field_order: 61,
            field_name: "err_kind",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 62,
            item_id: 1,
            field_order: 62,
            field_name: "err_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 63,
            item_id: 1,
            field_order: 63,
            field_name: "can_tryn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 64,
            item_id: 1,
            field_order: 64,
            field_name: "crt_tryn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 65,
            item_id: 1,
            field_order: 65,
            field_name: "hsong_tryn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 66,
            item_id: 1,
            field_order: 66,
            field_name: "trx_k",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 67,
            item_id: 1,
            field_order: 67,
            field_name: "acmt_gjdt",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 68,
            item_id: 1,
            field_order: 68,
            field_name: "opp_hwnno",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 69,
            item_id: 1,
            field_order: 69,
            field_name: "telr_trxno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 70,
            item_id: 1,
            field_order: 70,
            field_name: "telr_mg_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 71,
            item_id: 1,
            field_order: 71,
            field_name: "snd_sys_g",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 72,
            item_id: 1,
            field_order: 72,
            field_name: "infc_ds_g",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 73,
            item_id: 1,
            field_order: 73,
            field_name: "acmt_trxbrno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 74,
            item_id: 1,
            field_order: 74,
            field_name: "brj_no",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 75,
            item_id: 1,
            field_order: 75,
            field_name: "trx_telrno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 76,
            item_id: 1,
            field_order: 76,
            field_name: "nfcng_chan_user_msg_out_yn",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 77,
            item_id: 1,
            field_order: 77,
            field_name: "exrt_jkdt",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 78,
            item_id: 1,
            field_order: 78,
            field_name: "nat_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 79,
            item_id: 1,
            field_order: 79,
            field_name: "lcl_corp_c",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 80,
            item_id: 1,
            field_order: 80,
            field_name: "lang_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 81,
            item_id: 1,
            field_order: 81,
            field_name: "ta_ynd_org_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 82,
            item_id: 1,
            field_order: 82,
            field_name: "ta_ynd_upmu_c",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 83,
            item_id: 1,
            field_order: 83,
            field_name: "cusno",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 84,
            item_id: 1,
            field_order: 84,
            field_name: "digital_mach_inf",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 85,
            item_id: 1,
            field_order: 85,
            field_name: "next_infc_sys_g",
            field_type: "INT",
            field_length: 1,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 86,
            item_id: 1,
            field_order: 86,
            field_name: "filler",
            field_type: "VARCHAR",
            field_length: 10,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },

        // 2. Message
        {
            field_id: 100,
            item_id: 2,
            field_order: 1,
            field_name: "Cnt",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },

        // 4. MessageData
        {
            field_id: 101,
            item_id: 4,
            field_order: 1,
            field_name: "data_type",
            field_type: "VARCHAR",
            field_length: 2,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 102,
            item_id: 4,
            field_order: 2,
            field_name: "data_len",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 103,
            item_id: 4,
            field_order: 3,
            field_name: "trx_c",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 104,
            item_id: 4,
            field_order: 4,
            field_name: "screen_id",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 105,
            item_id: 4,
            field_order: 5,
            field_name: "form_cnt",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 106,
            item_id: 4,
            field_order: 6,
            field_name: "msg_attr",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 107,
            item_id: 4,
            field_order: 7,
            field_name: "err_field",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 108,
            item_id: 4,
            field_order: 8,
            field_name: "err_sub_info",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "Y",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 109,
            item_id: 4,
            field_order: 9,
            field_name: "msg_cnt",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },

        // 5. msg_data
        {
            field_id: 110,
            item_id: 5,
            field_order: 1,
            field_name: "msg_content",
            field_type: "VARCHAR",
            field_length: 100,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },

        // 6. DataHeader
        {
            field_id: 111,
            item_id: 6,
            field_order: 1,
            field_name: "data_type",
            field_type: "VARCHAR",
            field_length: 2,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 112,
            item_id: 6,
            field_order: 2,
            field_name: "data_len",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 113,
            item_id: 6,
            field_order: 3,
            field_name: "trx_c",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 114,
            item_id: 6,
            field_order: 4,
            field_name: "screen_id",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 115,
            item_id: 6,
            field_order: 5,
            field_name: "form_cnt",
            field_type: "INT",
            field_length: 10,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },

        // 7. DataBody
        {
            field_id: 116,
            item_id: 7,
            field_order: 1,
            field_name: "brNm",
            field_type: "VARCHAR",
            field_length: 50,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 117,
            item_id: 7,
            field_order: 2,
            field_name: "telno",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
        {
            field_id: 118,
            item_id: 7,
            field_order: 3,
            field_name: "girono",
            field_type: "VARCHAR",
            field_length: 20,
            default: "",
            null_yn: "N",
            masking: "",
            field_desc: "",
            status: "R",
        },
    ];

    // State
    let selectedJob = null;
    let selectedItem = null;
    let selectedField = null;

    // Derived State
    $: filteredItems = selectedJob
        ? allItems
              .filter((i) => i.job_id === selectedJob.job_id)
              .sort((a, b) => a.item_order - b.item_order)
        : [];

    $: filteredFields = selectedItem
        ? allFields
              .filter((f) => f.item_id === selectedItem.item_id)
              .sort((a, b) => a.field_order - b.field_order)
        : [];

    // Handlers
    function selectJob(job) {
        selectedJob = job;
        selectedItem = null; // cascade unselect
        selectedField = null; // cascade unselect
    }

    function selectItem(item) {
        selectedItem = item;
        selectedField = null; // cascade unselect
    }

    function selectField(field) {
        selectedField = field;
    }

    // Type Helpers
    function isLengthEditable(type) {
        // Types where length/precision usually matters in basic design
        return ["VARCHAR", "CHAR", "DECIMAL", "FLOAT", "DOUBLE"].includes(type);
    }

    // CRUD Handlers
    function addJob() {
        // Add new job with status 'N'
        const newJob = {
            job_id: Date.now(),
            job_code: "NEW_JOB",
            job_desc: "New Job Desc",
            status: "N",
        };
        jobs = [...jobs, newJob];
        selectJob(newJob);
    }

    function deleteJob() {
        if (!selectedJob) return alert("Select a Job to delete");

        if (selectedJob.status === "N") {
            if (!confirm("삭제하시겠습니까?")) return;
            jobs = jobs.filter((j) => j.job_id !== selectedJob.job_id);
            // Cascade delete items and fields
            allItems = allItems.filter((i) => i.job_id !== selectedJob.job_id);
            allFields = allFields.filter(
                (f) => !allItems.find((i) => i.item_id === f.item_id),
            );
            selectJob(null);
        } else {
            // Soft delete (Mark as 'D')
            if (!confirm("삭제하시겠습니까?")) return;
            // Update in place without removing from array
            jobs = jobs.map((j) =>
                j.job_id === selectedJob.job_id ? { ...j, status: "D" } : j,
            );
            // Re-select to reflect changes if needed, or just stay selected
            selectedJob = jobs.find((j) => j.job_id === selectedJob.job_id);
        }
    }

    function addItem() {
        if (!selectedJob) return alert("Select a Job first");
        const maxOrder =
            filteredItems.length > 0
                ? Math.max(...filteredItems.map((i) => i.item_order || 0))
                : 0;
        const newItem = {
            item_id: Date.now(),
            job_id: selectedJob.job_id,
            item_code: "NEW_ITEM",
            parent_item_code: null,
            item_order: maxOrder + 1,
            status: "N",
        };
        allItems = [...allItems, newItem];
        selectItem(newItem);
    }

    function deleteItem() {
        if (!selectedItem) return alert("Select an Item to delete");

        if (selectedItem.status === "N") {
            if (!confirm("삭제하시겠습니까?")) return;
            allItems = allItems.filter(
                (i) => i.item_id !== selectedItem.item_id,
            );
            allFields = allFields.filter(
                (f) => f.item_id !== selectedItem.item_id,
            );
            selectItem(null);
        } else {
            if (!confirm("삭제하시겠습니까?")) return;
            allItems = allItems.map((i) =>
                i.item_id === selectedItem.item_id ? { ...i, status: "D" } : i,
            );
            selectedItem = allItems.find(
                (i) => i.item_id === selectedItem.item_id,
            );
        }
    }

    function addField() {
        if (!selectedItem) return alert("Select an Item first");
        const maxOrder =
            filteredFields.length > 0
                ? Math.max(...filteredFields.map((f) => f.field_order))
                : 0;
        const newField = {
            field_id: Date.now(),
            item_id: selectedItem.item_id,
            field_name: "new_field",
            field_type: "VARCHAR",
            field_length: 10,
            field_desc: "",
            field_order: maxOrder + 1,
            masking: "",
            default: "",
            null_yn: "Y",
            status: "N",
        };
        allFields = [...allFields, newField];
    }

    function deleteField() {
        if (!selectedField) return alert("Select a Field row to delete");

        if (selectedField.status === "N") {
            if (!confirm("삭제하시겠습니까?")) return;
            allFields = allFields.filter(
                (f) => f.field_id !== selectedField.field_id,
            );
            selectedField = null;
        } else {
            if (!confirm("삭제하시겠습니까?")) return;
            allFields = allFields.map((f) =>
                f.field_id === selectedField.field_id
                    ? { ...f, status: "D" }
                    : f,
            );
            selectedField = allFields.find(
                (f) => f.field_id === selectedField.field_id,
            );
        }
    }

    function saveData() {
        // Simulate Save:
        // 1. Remove 'D' items physically
        // 2. Change 'N' items to 'R'

        let initialJobsCount = jobs.length;

        // Jobs
        jobs = jobs
            .filter((j) => j.status !== "D")
            .map((j) => (j.status === "N" ? { ...j, status: "R" } : j));

        // Items
        allItems = allItems
            .filter((i) => i.status !== "D")
            .map((i) => (i.status === "N" ? { ...i, status: "R" } : i));

        // Fields
        allFields = allFields
            .filter((f) => f.status !== "D")
            .map((f) => (f.status === "N" ? { ...f, status: "R" } : f));

        // Reset selections if they were deleted
        if (selectedJob && !jobs.find((j) => j.job_id === selectedJob.job_id)) {
            selectJob(null);
        }
        if (
            selectedItem &&
            !allItems.find((i) => i.item_id === selectedItem.item_id)
        ) {
            selectItem(null);
        }
        if (
            selectedField &&
            !allFields.find((f) => f.field_id === selectedField.field_id)
        ) {
            selectedField = null;
        }

        alert("저장되었습니다.");
    }
</script>

<div class="container mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-700">Job Config</h2>
        <!-- Buttons -->
        <div class="space-x-2">
            <button
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                조회
            </button>
            <button
                on:click={saveData}
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                저장
            </button>
        </div>
    </div>

    <!-- Main Content (Vertical Flex) -->
    <div class="flex flex-col gap-4 h-[calc(100vh-200px)]">
        <!-- Top Row: JOBS and ITEMS -->
        <div class="flex gap-4 h-1/2">
            <!-- Column 1: JOBS -->
            <div class="w-1/2 flex flex-col">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-700">
                        Jobs ({jobs.length})
                    </h3>
                    <div class="flex space-x-1">
                        <button
                            on:click={addJob}
                            class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                            >+</button
                        >
                        <button
                            on:click={deleteJob}
                            class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                            >-</button
                        >
                    </div>
                </div>

                <div
                    class="bg-white shadow overflow-hidden border border-gray-300 flex-1 overflow-y-auto"
                >
                    <table
                        class="min-w-full border-collapse border border-gray-300 table-fixed text-sm"
                    >
                        <thead
                            class="bg-gray-50 text-gray-700 sticky top-0 z-10"
                        >
                            <tr>
                                <th
                                    class="w-10 border border-gray-300 px-1 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Sts</th
                                >
                                <th
                                    class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Job Code</th
                                >
                                <th
                                    class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Description</th
                                >
                            </tr>
                        </thead>
                        <tbody class="bg-white">
                            {#each jobs as job}
                                <tr
                                    on:click={() => selectJob(job)}
                                    class="cursor-pointer hover:bg-gray-50 {selectedJob?.job_id ===
                                    job.job_id
                                        ? 'bg-blue-100'
                                        : ''}"
                                >
                                    <td
                                        class="border border-gray-300 px-1 py-1 text-center font-bold {job.status ===
                                        'N'
                                            ? 'text-green-600'
                                            : job.status === 'D'
                                              ? 'text-red-600'
                                              : 'text-gray-400'}"
                                    >
                                        {job.status === "R" ? "" : job.status}
                                    </td>
                                    <td
                                        class="border border-gray-300 px-2 py-1 truncate font-medium text-gray-900"
                                        contenteditable="true"
                                        bind:textContent={job.job_code}
                                    ></td>
                                    <td
                                        class="border border-gray-300 px-2 py-1 truncate text-gray-500"
                                        contenteditable="true"
                                        bind:textContent={job.job_desc}
                                    ></td>
                                </tr>
                            {/each}
                            {#if jobs.length === 0}
                                <tr
                                    ><td
                                        colspan="3"
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-400"
                                        >No Jobs</td
                                    ></tr
                                >
                            {/if}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Column 2: ITEMS -->
            <div class="w-1/2 flex flex-col">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-700">
                        Items ({filteredItems.length})
                    </h3>
                    <div class="flex space-x-1">
                        <button
                            on:click={addItem}
                            class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                            >+</button
                        >
                        <button
                            on:click={deleteItem}
                            class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                            >-</button
                        >
                    </div>
                </div>

                <div
                    class="bg-white shadow overflow-hidden border border-gray-300 flex-1 overflow-y-auto"
                >
                    <table
                        class="min-w-full border-collapse border border-gray-300 table-fixed text-sm"
                    >
                        <thead
                            class="bg-gray-50 text-gray-700 sticky top-0 z-10"
                        >
                            <tr>
                                <th
                                    class="w-10 border border-gray-300 px-1 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Sts</th
                                >
                                <th
                                    class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Order</th
                                >
                                <th
                                    class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Item Code</th
                                >
                                <th
                                    class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                    >Parent</th
                                >
                            </tr>
                        </thead>
                        <tbody class="bg-white">
                            {#if !selectedJob}
                                <tr
                                    ><td
                                        colspan="4"
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-400"
                                        >Select a Job</td
                                    ></tr
                                >
                            {:else}
                                {#each filteredItems as item}
                                    <tr
                                        on:click={() => selectItem(item)}
                                        class="cursor-pointer hover:bg-gray-50 {selectedItem?.item_id ===
                                        item.item_id
                                            ? 'bg-blue-100'
                                            : ''}"
                                    >
                                        <td
                                            class="border border-gray-300 px-1 py-1 text-center font-bold {item.status ===
                                            'N'
                                                ? 'text-green-600'
                                                : item.status === 'D'
                                                  ? 'text-red-600'
                                                  : 'text-gray-400'}"
                                        >
                                            {item.status === "R"
                                                ? ""
                                                : item.status}
                                        </td>
                                        <td
                                            class="border border-gray-300 px-2 py-1 text-center text-gray-500"
                                            contenteditable="true"
                                            bind:textContent={item.item_order}
                                        ></td>
                                        <td
                                            class="border border-gray-300 px-2 py-1 truncate font-medium text-gray-900"
                                            contenteditable="true"
                                            bind:textContent={item.item_code}
                                        ></td>
                                        <td
                                            class="border border-gray-300 px-2 py-1 truncate text-gray-500"
                                            contenteditable="true"
                                            bind:textContent={
                                                item.parent_item_code
                                            }
                                        ></td>
                                    </tr>
                                {/each}
                                {#if filteredItems.length === 0}
                                    <tr
                                        ><td
                                            colspan="4"
                                            class="border border-gray-300 px-2 py-1 text-center text-gray-400"
                                            >No Items</td
                                        ></tr
                                    >
                                {/if}
                            {/if}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Row 2: FIELDS (Full Width) -->
        <div class="flex-1 flex flex-col h-1/2">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-gray-700">
                    Fields ({filteredFields.length})
                </h3>
                <div class="flex space-x-1">
                    <button
                        on:click={addField}
                        class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                        >+</button
                    >
                    <button
                        on:click={deleteField}
                        class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm"
                        >-</button
                    >
                </div>
            </div>

            <div
                class="bg-white shadow overflow-hidden border border-gray-300 flex-1 overflow-y-auto"
            >
                <table
                    class="min-w-full border-collapse border border-gray-300 table-fixed text-sm"
                >
                    <thead class="bg-gray-50 text-gray-700 sticky top-0 z-10">
                        <tr>
                            <th
                                class="w-10 border border-gray-300 px-1 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Sts</th
                            >
                            <th
                                class="w-32 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Name</th
                            >
                            <th
                                class="w-24 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Type</th
                            >
                            <th
                                class="w-16 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Len</th
                            >
                            <th
                                class="w-12 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Ord</th
                            >
                            <th
                                class="w-16 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Mask</th
                            >
                            <th
                                class="w-16 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Def</th
                            >
                            <th
                                class="w-16 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Null</th
                            >
                            <th
                                class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                                >Desc</th
                            >
                        </tr>
                    </thead>
                    <tbody class="bg-white">
                        {#if !selectedItem}
                            <tr
                                ><td
                                    colspan="9"
                                    class="border border-gray-300 px-2 py-1 text-center text-gray-400"
                                    >Select an Item</td
                                ></tr
                            >
                        {:else}
                            {#each filteredFields as field}
                                <tr
                                    on:click={() => selectField(field)}
                                    class="cursor-pointer hover:bg-gray-50 {selectedField?.field_id ===
                                    field.field_id
                                        ? 'bg-blue-100'
                                        : ''}"
                                >
                                    <td
                                        class="border border-gray-300 px-1 py-1 text-center font-bold {field.status ===
                                        'N'
                                            ? 'text-green-600'
                                            : field.status === 'D'
                                              ? 'text-red-600'
                                              : 'text-gray-400'}"
                                    >
                                        {field.status === "R"
                                            ? ""
                                            : field.status}
                                    </td>

                                    <td
                                        class="border border-gray-300 px-2 py-1 truncate text-gray-900"
                                        contenteditable="true"
                                        bind:textContent={field.field_name}
                                    ></td>

                                    <!-- Type Select -->
                                    <td
                                        class="border border-gray-300 p-1 text-center"
                                    >
                                        <select
                                            bind:value={field.field_type}
                                            class="w-full text-xs border-none bg-transparent focus:ring-0"
                                        >
                                            {#each mariaDBTypes as type}
                                                <option value={type}
                                                    >{type}</option
                                                >
                                            {/each}
                                        </select>
                                    </td>

                                    <!-- Length (Editable only if Type supports it) -->
                                    {#if isLengthEditable(field.field_type)}
                                        <td
                                            class="border border-gray-300 px-2 py-1 text-center text-gray-500"
                                            contenteditable="true"
                                            bind:textContent={
                                                field.field_length
                                            }
                                        ></td>
                                    {:else}
                                        <td
                                            class="border border-gray-300 px-2 py-1 text-center text-gray-500 bg-gray-100"
                                            contenteditable="false"
                                            >{field.field_length}</td
                                        >
                                    {/if}

                                    <td
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-500"
                                        contenteditable="true"
                                        bind:textContent={field.field_order}
                                    ></td>
                                    <td
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-500"
                                        contenteditable="true"
                                        bind:textContent={field.masking}
                                    ></td>
                                    <td
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-500"
                                        contenteditable="true"
                                        bind:textContent={field.default}
                                    ></td>

                                    <!-- Null Select -->
                                    <td
                                        class="border border-gray-300 p-1 text-center"
                                    >
                                        <select
                                            bind:value={field.null_yn}
                                            class="w-full text-xs border-none bg-transparent focus:ring-0"
                                        >
                                            <option value="Y">Y</option>
                                            <option value="N">N</option>
                                        </select>
                                    </td>

                                    <td
                                        class="border border-gray-300 px-2 py-1 truncate text-gray-500"
                                        contenteditable="true"
                                        bind:textContent={field.field_desc}
                                    ></td>
                                </tr>
                            {/each}
                            {#if filteredFields.length === 0}
                                <tr
                                    ><td
                                        colspan="9"
                                        class="border border-gray-300 px-2 py-1 text-center text-gray-400"
                                        >No fields</td
                                    ></tr
                                >
                            {/if}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
